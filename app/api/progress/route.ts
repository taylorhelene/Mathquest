import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { progressCollection } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ progress: [] });
  }
  try {
    const col = await progressCollection();
    const rows = await col.find({ userId: session.userId }).toArray();
    return NextResponse.json({
      progress: rows.map((r) => ({
        lessonId: r.lessonId,
        attempts: r.attempts,
        correct: r.correct,
        completedAt: r.completedAt,
      })),
    });
  } catch {
    return NextResponse.json({ progress: [] });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to save progress." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const lessonId =
      typeof body.lessonId === "string" ? body.lessonId : "";
    const correct = Boolean(body.correct);

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }

    const col = await progressCollection();
    const existing = await col.findOne({
      userId: session.userId,
      lessonId,
    });

    const now = new Date();
    if (existing) {
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            correct: existing.correct || correct,
            lastAttemptAt: now,
            ...(correct && !existing.completedAt ? { completedAt: now } : {}),
          },
          $inc: { attempts: 1 },
        },
      );
    } else {
      await col.insertOne({
        userId: session.userId,
        lessonId,
        attempts: 1,
        correct,
        lastAttemptAt: now,
        ...(correct ? { completedAt: now } : {}),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Progress save error:", err);
    return NextResponse.json({ error: "Could not save progress." }, { status: 500 });
  }
}
