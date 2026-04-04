/**
 * Name of the environment variable Prisma uses for the Postgres URL.
 * Must stay in sync with `url = env("…")` in prisma/schema.prisma.
 * On Vercel + Neon Storage this is often injected as `neon_storage_POSTGRES_URL`.
 */
export const PRISMA_DATABASE_URL_ENV = "neon_storage_POSTGRES_URL";
