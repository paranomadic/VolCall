/**
 * Long-running VolCall alert loop (PRD §6.1–6.3).
 * Run: npm run alert-engine
 *
 * Polls Deribit DVOL, evaluates PRD default thresholds, applies Redis cooldown when REDIS_URL
 * is set, and logs / optionally places Twilio voice calls when ALERT_ENGINE_DRY_RUN is not "true".
 */

import twilio from "twilio";
import { prisma } from "../lib/prisma";
import { fetchDvol } from "../lib/deribit";
import {
  classifyForAsset,
  shouldAlert,
} from "../lib/thresholds";
import { canPlaceCallCooldown, getRedis } from "../lib/redis";

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
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) {
    console.warn(
      `[volcall] skip voice: set TWILIO_FROM_NUMBER (user ${params.userId})`,
    );
    return;
  }
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!,
  );
  const twiml = `<Response><Say voice="Polly.Joanna">Hello, this is VolCall. ${params.asset} implied volatility is at ${params.dvol.toFixed(
    1,
  )}, band ${params.band}. Please review your positions. Press 9 to opt out on future marketing calls where allowed.</Say></Response>`;

  const call = await client.calls.create({
    to: params.e164,
    from,
    twiml,
  });
  console.info(`[volcall] twilio call ${call.sid} -> ${params.e164}`);
}

async function tick() {
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
    const band = classifyForAsset(asset, dvol);
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
