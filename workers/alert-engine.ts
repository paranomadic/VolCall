/**
 * Long-running VolCall alert loop (PRD §6.1–6.3).
 * Run: npm run alert-engine
 *
 * Polls Deribit DVOL, evaluates PRD default thresholds, applies Redis cooldown when REDIS_URL
 * is set, and logs / optionally places Vapi (primary) or Twilio voice calls when ALERT_ENGINE_DRY_RUN is not "true".
 */

import { prisma } from "../lib/prisma";
import { fetchDvol } from "../lib/deribit";
import { shouldAlert } from "../lib/thresholds";
import { classifyForAssetFromSettings } from "../lib/thresholds-configurable";
import { getEngineSettings } from "../lib/engine-settings";
import { canPlaceCallCooldown, getRedis } from "../lib/redis";
import { placeOutboundVoiceAlert } from "../lib/voice-outbound";

const POLL_MS = 60_000;
const ASSETS = ["BTC", "ETH"] as const;

function dryRun(): boolean {
  return process.env.ALERT_ENGINE_DRY_RUN !== "false";
}

async function recordReading(asset: string, dvol: number) {
  await prisma.feedReading.create({
    data: {
      source: "deribit",
      asset,
      dvol,
      detail: `poll ${new Date().toISOString()}`,
    },
  });
}

async function maybeCallUser(params: {
  userId: string;
  e164: string;
  asset: string;
  dvol: number;
  band: string;
}) {
  const out = await placeOutboundVoiceAlert({
    e164: params.e164,
    asset: params.asset,
    dvol: params.dvol,
    band: params.band,
  });
  if (out.ok) {
    console.info(
      `[volcall] ${out.channel} call ${out.id ?? "?"} -> ${params.e164}`,
    );
    return;
  }
  console.warn(`[volcall] skip voice: ${out.message} (user ${params.userId})`);
}

async function tick() {
  const settings = await getEngineSettings();
  for (const asset of ASSETS) {
    let dvol: number | null = null;
    try {
      dvol = await fetchDvol(asset);
    } catch (e) {
      console.error(`[volcall] deribit ${asset}`, e);
      continue;
    }
    if (dvol == null) {
      console.warn(`[volcall] no dvol for ${asset}`);
      continue;
    }

    await recordReading(asset, dvol);
    const band = classifyForAssetFromSettings(asset, dvol, settings);
    if (!shouldAlert(band)) {
      continue;
    }

    const critical = band === "critical";
    const users = await prisma.user.findMany({
      where: {
        subscription: {
          is: {
            state: "ACTIVE",
            onboardingStep: { gte: 4 },
          },
        },
        alertPrefs: {
          some: { asset, enabled: true },
        },
      },
      include: {
        phoneNumbers: { where: { verified: true, enabled: true } },
      },
    });

    for (const user of users) {
      const redis = getRedis();
      let allowed = true;
      if (redis) {
        allowed = await canPlaceCallCooldown(user.id, asset, critical);
      } else {
        const recent = await prisma.callEvent.findFirst({
          where: {
            userId: user.id,
            asset,
            occurredAt: {
              gte: new Date(Date.now() - 86_400_000),
            },
          },
        });
        allowed = !recent;
      }
      if (!allowed) continue;

      for (const phone of user.phoneNumbers) {
        const trigger = `${asset} DVOL ${dvol.toFixed(1)} (${band})`;
        if (dryRun()) {
          console.info(
            `[volcall] DRY_RUN would call ${phone.e164}: ${trigger} (user ${user.id})`,
          );
          await prisma.callEvent.create({
            data: {
              userId: user.id,
              asset,
              trigger: `${trigger} [dry-run]`,
              answered: false,
            },
          });
          break;
        }

        try {
          await maybeCallUser({
            userId: user.id,
            e164: phone.e164,
            asset,
            dvol,
            band,
          });
          await prisma.callEvent.create({
            data: {
              userId: user.id,
              asset,
              trigger,
              answered: false,
            },
          });
        } catch (e) {
          console.error(`[volcall] call failed`, e);
        }
        break;
      }
    }
  }
}

async function main() {
  console.info(
    `[volcall] engine start dryRun=${dryRun()} redis=${Boolean(getRedis())}`,
  );
  for (;;) {
    try {
      await tick();
    } catch (e) {
      console.error("[volcall] tick error", e);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

void main();
