import { NextResponse } from "next/server";
import { getCurrentUser, clearAuthCookie, getSession } from "@/lib/auth";

export const runtime = "nodejs";

function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    const email = user.email;
    const role =
      user.role === "admin" || isAdminEmail(email) ? "admin" : user.role || "learner";
    // Admins always get paid access for testing lessons
    const hasPaidAccess = Boolean(user.hasPaidAccess) || role === "admin";

    return NextResponse.json({
      user: {
        id: (user._id as any).toString(),
        email,
        name: user.name,
        hasPaidAccess,
        role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  await clearAuthCookie();
  return NextResponse.json({ ok: true });
}
