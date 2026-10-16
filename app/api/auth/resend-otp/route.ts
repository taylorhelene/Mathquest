import { NextResponse } from "next/server";
import { usersCollection } from "@/lib/db";
import { generateOtp, sendOtpEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Already verified. Sign in." }, { status: 400 });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 8);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await users.updateOne({ email }, { $set: { otpHash, otpExpires } });

    const sent = await sendOtpEmail(email, otp, user.name);
    if (!sent.ok) {
      return NextResponse.json(
        { error: "Could not send email." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        sent.mode === "dev_log"
          ? "OTP logged on server (set RESEND_API_KEY)."
          : "A new code was sent to your email.",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return NextResponse.json({ error: "Could not resend code." }, { status: 500 });
  }
}
