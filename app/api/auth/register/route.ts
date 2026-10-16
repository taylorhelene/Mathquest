import { NextResponse } from "next/server";
import { usersCollection } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateOtp, sendOtpEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !name || password.length < 6) {
      return NextResponse.json(
        { error: "Name, valid email and password (min 6 chars) required." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const existing = await users.findOne({ email });

    if (existing?.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 8);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (existing && !existing.emailVerified) {
      await users.updateOne(
        { email },
        {
          $set: {
            name,
            passwordHash,
            otpHash,
            otpExpires,
            emailVerified: false,
          },
        },
      );
    } else {
      await users.insertOne({
        email,
        name,
        passwordHash,
        hasPaidAccess: false,
        emailVerified: false,
        otpHash,
        otpExpires,
        createdAt: new Date(),
        role: "learner",
      } as any);
    }

    const sent = await sendOtpEmail(email, otp, name);
    if (!sent.ok) {
      return NextResponse.json(
        {
          error:
            "Could not send verification email. Check RESEND_API_KEY or try again.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      needsVerification: true,
      email,
      message:
        sent.mode === "dev_log"
          ? "OTP logged on the server (set RESEND_API_KEY to email it)."
          : "Check your email for a 6-digit verification code.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Is MongoDB configured?" },
      { status: 500 },
    );
  }
}
