/**
 * During `npm run build`, sync Prisma schema to Postgres when the URL is present.
 * Skips cleanly when unset so local `next build` works without a database.
 */
import { spawnSync } from "node:child_process";

const url = process.env.neon_storage_POSTGRES_URL?.trim();

if (!url) {
  console.log(
    "[build] Skipping prisma db push (neon_storage_POSTGRES_URL not set).",
  );
  process.exit(0);
}

const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate"],
  { stdio: "inherit" },
);

process.exit(result.status === 0 ? 0 : result.status ?? 1);
