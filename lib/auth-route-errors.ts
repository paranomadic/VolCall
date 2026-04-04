import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Maps auth-route failures to safe, actionable messages. Full error is always logged server-side.
 */
export function authRouteErrorResponse(
  e: unknown,
  logLabel: string,
): NextResponse {
  console.error(`[${logLabel}]`, e);

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P1001":
        return NextResponse.json(
          {
            error:
              "Cannot reach the database. Check DATABASE_URL and that Postgres allows connections from your host (e.g. Vercel IPs or SSL mode).",
          },
          { status: 503 },
        );
      case "P1000":
      case "P1017":
        return NextResponse.json(
          {
            error:
              "Database authentication failed. Verify DATABASE_URL user, password, and database name.",
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
              "Database schema is missing. Run: npx prisma db push (with your production DATABASE_URL in the environment).",
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

  if (e instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error:
          "Cannot open database connection. Use a postgresql:// DATABASE_URL and ensure the database exists.",
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
          "Database network error. Confirm DATABASE_URL host, port, and that the DB accepts remote connections.",
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
        "Server error. On Vercel: set JWT_SECRET (16+ characters) and PostgreSQL DATABASE_URL; run `npx prisma db push` against that database. Open Deployment → Logs for the full error.",
    },
    { status: 500 },
  );
}
