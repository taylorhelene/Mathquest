import { NextResponse } from "next/server";
import { usersCollection } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP required." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (user.emailVerified) {
      const id = (user._id as any).toString();
      const token = await createToken({
        id,
        email: user.email,
        role: user.role || "learner",
      });
      await setAuthCookie(token);
      return NextResponse.json({
        user: {
          id,
          email: user.email,
          name: user.name,
          hasPaidAccess: user.hasPaidAccess,
          role: user.role || "learner",
        },
      });
    }

    if (!user.otpHash || !user.otpExpires) {
      return NextResponse.json(
        { error: "No OTP pending. Register again." },
        { status: 400 },
      );
    }

    if (new Date() > new Date(user.otpExpires)) {
      return NextResponse.json(
        { error: "Code expired. Request a new one." },
        { status: 400 },
      );
    }

    const ok = await bcrypt.compare(otp, user.otpHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid code." }, { status: 401 });
    }

    await users.updateOne(
      { email },
      {
        $set: { emailVerified: true },
        $unset: { otpHash: "", otpExpires: "" },
      },
    );

    const id = (user._id as any).toString();
    const token = await createToken({
      id,
      email: user.email,
      role: user.role || "learner",
    });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id,
        email: user.email,
        name: user.name,
        hasPaidAccess: user.hasPaidAccess,
        role: user.role || "learner",
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 },
    );
  }
}
