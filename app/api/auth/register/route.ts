import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { usersCollection } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

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
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const doc = {
      email,
      name,
      passwordHash,
      hasPaidAccess: false,
      createdAt: new Date(),
      role: "learner" as const,
    };

    const result = await users.insertOne(doc as any);
    const id = result.insertedId.toString();
    const token = await createToken({ id, email, role: "learner" });
    await setAuthCookie(token);

    return NextResponse.json({
      user: { id, email, name, hasPaidAccess: false },
    });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Is MongoDB configured?" },
      { status: 500 },
    );
  }
}
