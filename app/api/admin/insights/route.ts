import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  usersCollection,
  ordersCollection,
  serviceEventsCollection,
  artistsCollection,
} from "@/lib/db";

export const runtime = "nodejs";

function isAdmin(email: string, role?: string) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return role === "admin" || list.includes(email.toLowerCase());
}

type Snapshot = {
  users: number;
  verified: number;
  unverified: number;
  paid: number;
  revenueKES: number;
  pendingPayments: number;
  failedPayments: number;
  confirmedPayments: number;
  artistsPending: number;
  artistsApproved: number;
  gemmaErrors24h: number;
  gemmaHints24h: number;
  ttsErrors24h: number;
};

async function loadSnapshot(): Promise<Snapshot> {
  const users = await usersCollection();
  const orders = await ordersCollection();
  const events = await serviceEventsCollection();
  const artists = await artistsCollection();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const completed = await orders.find({ status: "completed" }).toArray();

  return {
    users: await users.countDocuments(),
    verified: await users.countDocuments({ emailVerified: true }),
    unverified: await users.countDocuments({ emailVerified: false }),
    paid: await users.countDocuments({ hasPaidAccess: true }),
    revenueKES: completed.reduce((s, o) => s + (o.amount || 0), 0),
    pendingPayments: await orders.countDocuments({ status: "pending" }),
    failedPayments: await orders.countDocuments({ status: "failed" }),
    confirmedPayments: completed.length,
    artistsPending: await artists.countDocuments({ status: "pending" }),
    artistsApproved: await artists.countDocuments({ status: "approved" }),
    gemmaErrors24h: await events.countDocuments({
      service: "gemma",
      level: "error",
      createdAt: { $gte: dayAgo },
    }),
    gemmaHints24h: await events.countDocuments({
      service: "gemma",
      code: "hint_ok",
      createdAt: { $gte: dayAgo },
    }),
    ttsErrors24h: await events.countDocuments({
      service: "elevenlabs",
      level: "error",
      createdAt: { $gte: dayAgo },
    }),
  };
}

function localBriefing(s: Snapshot): {
  highlights: string[];
  checkNow: string[];
  approvals: string[];
  summary: string;
} {
  const highlights: string[] = [];
  const checkNow: string[] = [];
  const approvals: string[] = [];

  highlights.push(
    `${s.users} registered users · ${s.verified} email-verified · ${s.paid} with paid access`,
  );
  highlights.push(
    `Revenue KES ${s.revenueKES} from ${s.confirmedPayments} confirmed M-Pesa payments`,
  );
  highlights.push(
    `Gemma hints OK (24h): ${s.gemmaHints24h} · TTS errors (24h): ${s.ttsErrors24h}`,
  );

  if (s.artistsPending > 0) {
    approvals.push(
      `${s.artistsPending} artist model submission(s) waiting for approve/reject`,
    );
  } else {
    approvals.push("No artist submissions pending approval");
  }

  if (s.pendingPayments > 0) {
    checkNow.push(
      `${s.pendingPayments} M-Pesa order(s) still pending — use STK Query or wait for callback (ResultCode 0)`,
    );
  }
  if (s.failedPayments > 0) {
    checkNow.push(
      `${s.failedPayments} failed payment(s) (cancelled/timeout) — normal if users aborted PIN`,
    );
  }
  if (s.unverified > 0) {
    checkNow.push(
      `${s.unverified} user(s) have not verified email OTP yet`,
    );
  }
  if (s.ttsErrors24h > 0) {
    checkNow.push(
      `${s.ttsErrors24h} ElevenLabs error(s) in 24h — check quota/API key (learners still get browser voice)`,
    );
  }
  if (s.gemmaErrors24h > 0) {
    checkNow.push(
      `${s.gemmaErrors24h} Gemma error(s) in 24h — hints may be using built-in fallback`,
    );
  }
  if (checkNow.length === 0) {
    checkNow.push("Nothing urgent — payments and AI services look calm");
  }

  const summary =
    s.artistsPending > 0 || s.pendingPayments > 0
      ? `Priority: review ${s.artistsPending} artist approval(s) and ${s.pendingPayments} pending payment(s).`
      : `Platform steady: ${s.paid} paid learners, KES ${s.revenueKES} revenue, no critical queues.`;

  return { highlights, checkNow, approvals, summary };
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.email, session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await loadSnapshot();
    const fallback = localBriefing(snapshot);

    const gemmaUrl = process.env.GEMMA_API_URL;
    const gemmaKey = process.env.GEMMA_API_KEY;

    if (!gemmaUrl || !gemmaKey) {
      return NextResponse.json({
        source: "local",
        snapshot,
        ...fallback,
      });
    }

    const prompt = `You are an ops assistant for Math Quest (edtech with M-Pesa, 3D lessons, artist gallery).
Read this JSON dashboard snapshot and reply with STRICT JSON only (no markdown):
{
  "summary": "1-2 sentence executive summary",
  "highlights": ["3-5 short positive or neutral facts"],
  "checkNow": ["2-5 concrete things the admin should check or fix"],
  "approvals": ["items needing approve/reject or empty queue message"]
}
Be specific with numbers from the data. Prefer action verbs for checkNow and approvals.
Data:
${JSON.stringify(snapshot)}`;

    try {
      const res = await fetch(gemmaUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gemmaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.GEMMA_MODEL || "gemma-2-9b-it",
          messages: [
            {
              role: "system",
              content:
                "You summarise admin dashboards for a maths learning app. Output valid JSON only.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text =
          data?.choices?.[0]?.message?.content ||
          data?.content ||
          data?.text ||
          "";
        const raw = String(text).trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            source: "gemma",
            snapshot,
            summary:
              typeof parsed.summary === "string"
                ? parsed.summary
                : fallback.summary,
            highlights: Array.isArray(parsed.highlights)
              ? parsed.highlights.map(String)
              : fallback.highlights,
            checkNow: Array.isArray(parsed.checkNow)
              ? parsed.checkNow.map(String)
              : fallback.checkNow,
            approvals: Array.isArray(parsed.approvals)
              ? parsed.approvals.map(String)
              : fallback.approvals,
          });
        }
      }
    } catch (err) {
      console.error("Gemma insights failed:", err);
    }

    return NextResponse.json({
      source: "local",
      snapshot,
      ...fallback,
      note: "Gemma unavailable — showing local briefing",
    });
  } catch (err) {
    console.error("Insights error:", err);
    return NextResponse.json(
      { error: "Could not build insights" },
      { status: 500 },
    );
  }
}
