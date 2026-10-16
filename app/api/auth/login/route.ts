import { NextResponse } from "next/server";
import { usersCollection } from "@/lib/db";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    if (user.emailVerified === false) {
      return NextResponse.json(
        {
          error: "Email not verified. Enter the OTP sent to your inbox.",
          needsVerification: true,
          email: user.email,
        },
        { status: 403 },
      );
    }

    const id = (user._id as any).toString();
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean);
    const role =
      user.role === "admin" || adminEmails.includes(user.email.toLowerCase())
        ? "admin"
        : user.role || "learner";
    const hasPaidAccess = Boolean(user.hasPaidAccess) || role === "admin";

    const token = await createToken({
      id,
      email: user.email,
      role,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id,
        email: user.email,
        name: user.name,
        hasPaidAccess,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed. Is MongoDB configured?" },
      { status: 500 },
    );
  }
}
