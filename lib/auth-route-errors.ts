import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { PRISMA_DATABASE_URL_ENV } from "@/lib/db-env";

const ENV_NOT_FOUND = `Environment variable not found: ${PRISMA_DATABASE_URL_ENV}`;

/**
 * Maps auth-route failures to safe, actionable messages. Full error is always logged server-side.
 */
function isPrismaInitError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    typeof e === "object" &&
    e !== null &&
    (e as { name?: string }).name === "PrismaClientInitializationError"
  ) {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes(ENV_NOT_FOUND);
}

export function authRouteErrorResponse(
  e: unknown,
  logLabel: string,
): NextResponse {
  console.error(`[${logLabel}]`, e);

  const msgEarly = e instanceof Error ? e.message : String(e);
  if (msgEarly.includes(ENV_NOT_FOUND)) {
    return NextResponse.json(
      {
        error:
          `${PRISMA_DATABASE_URL_ENV} is not set for this deployment. In Vercel, Neon Storage usually injects this automatically; or add it under Settings → Environment Variables for Production and Preview, then Redeploy.`,
      },
      { status: 503 },
    );
  }

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P1001":
        return NextResponse.json(
          {
            error:
              `Cannot reach the database. Check ${PRISMA_DATABASE_URL_ENV} and that Postgres allows connections from your host (e.g. SSL mode).`,
          },
          { status: 503 },
        );
      case "P1000":
      case "P1017":
        return NextResponse.json(
          {
            error:
              `Database authentication failed. Verify ${PRISMA_DATABASE_URL_ENV} user, password, and database name.`,
          },
          { status: 503 },
        );
      case "P2002":
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      case "P2021":
      case "P2022":
        return NextResponse.json(
          {
            error:
              `Database schema is missing. Run: npx prisma db push (with ${PRISMA_DATABASE_URL_ENV} set to your Postgres URL).`,
          },
          { status: 503 },
        );
      default:
        return NextResponse.json(
          {
            error: `Database error (${e.code}). See deployment logs. If tables are missing, run prisma db push.`,
          },
          { status: 500 },
        );
    }
  }

  if (isPrismaInitError(e)) {
    return NextResponse.json(
      {
        error:
          `Cannot open the database. Confirm ${PRISMA_DATABASE_URL_ENV} is a valid postgresql:// URL in Vercel Environment Variables, then Redeploy.`,
      },
      { status: 503 },
    );
  }

  const msg = e instanceof Error ? e.message : String(e);
  const lower = msg.toLowerCase();

  if (msg.includes("JWT_SECRET") || lower.includes("min 16 characters")) {
    return NextResponse.json(
      {
        error:
          "Set JWT_SECRET in your host environment (e.g. Vercel) to at least 16 characters, then redeploy.",
      },
      { status: 500 },
    );
  }

  if (
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("getaddrinfo") ||
    lower.includes("timeout") ||
    lower.includes("can't reach database") ||
    lower.includes("server has closed the connection")
  ) {
    return NextResponse.json(
      {
        error:
          `Database network error. Confirm ${PRISMA_DATABASE_URL_ENV} host, port, and that the DB accepts remote connections.`,
      },
      { status: 503 },
    );
  }

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      {
        error: msg.split("\n")[0].slice(0, 300) || "Request failed.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error:
        `Server error. On Vercel: set JWT_SECRET (16+ characters) and Postgres URL in ${PRISMA_DATABASE_URL_ENV}; run npx prisma db push against that database. Open Deployment → Logs for the full error.`,
    },
    { status: 500 },
  );
}
