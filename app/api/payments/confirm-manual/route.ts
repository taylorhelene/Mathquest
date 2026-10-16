import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Sandbox manual unlock is disabled for all users in production.
 * Learners must complete a real M-Pesa payment (ResultCode 0).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Sandbox trial unlock is disabled. Complete a real M-Pesa payment, then use “I’ve paid — check status”.",
    },
    { status: 403 },
  );
}
