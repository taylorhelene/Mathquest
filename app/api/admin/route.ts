import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  usersCollection,
  ordersCollection,
  serviceEventsCollection,
  artistsCollection,
} from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin =
    session.role === "admin" ||
    adminEmails.includes(session.email.toLowerCase());

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await usersCollection();
    const orders = await ordersCollection();
    const events = await serviceEventsCollection();
    const artists = await artistsCollection();

    const userCount = await users.countDocuments();
    const paidUsers = await users.countDocuments({ hasPaidAccess: true });
    const verifiedUsers = await users.countDocuments({ emailVerified: true });
    const unverifiedUsers = await users.countDocuments({
      emailVerified: false,
    });

    const completed = await orders
      .find({ status: "completed" })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    const pending = await orders.countDocuments({ status: "pending" });
    const failed = await orders.countDocuments({ status: "failed" });
    const totalRevenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0);

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const ttsErrors24h = await events.countDocuments({
      service: "elevenlabs",
      level: "error",
      createdAt: { $gte: dayAgo },
    });
    const ttsErrorsTotal = await events.countDocuments({
      service: "elevenlabs",
      level: "error",
    });

    const gemmaErrors24h = await events.countDocuments({
      service: "gemma",
      level: "error",
      createdAt: { $gte: dayAgo },
    });
    const gemmaErrorsTotal = await events.countDocuments({
      service: "gemma",
      level: "error",
    });
    const gemmaHints24h = await events.countDocuments({
      service: "gemma",
      code: "hint_ok",
      createdAt: { $gte: dayAgo },
    });
    const gemmaFallback24h = await events.countDocuments({
      service: "gemma",
      code: { $in: ["not_configured", "empty_response", "upstream_error", "network_error"] },
      createdAt: { $gte: dayAgo },
    });

    const artistsPending = await artists.countDocuments({ status: "pending" });
    const artistsApproved = await artists.countDocuments({
      status: "approved",
    });

    const recentServiceEvents = await events
      .find({ service: { $in: ["elevenlabs", "gemma"] } })
      .sort({ createdAt: -1 })
      .limit(40)
      .toArray();

    const recentUsers = await users
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .project({ passwordHash: 0, otpHash: 0 })
      .toArray();

    const recentArtists = await artists
      .find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({
      stats: {
        userCount,
        paidUsers,
        verifiedUsers,
        unverifiedUsers,
        pendingPayments: pending,
        failedPayments: failed,
        totalRevenueKES: totalRevenue,
        confirmedPayments: completed.length,
        ttsErrors24h,
        ttsErrorsTotal,
        gemmaErrors24h,
        gemmaErrorsTotal,
        gemmaHints24h,
        gemmaFallback24h,
        artistsPending,
        artistsApproved,
      },
      recentPayments: completed.map((o) => ({
        id: (o._id as any).toString(),
        email: o.email,
        amount: o.amount,
        currency: o.currency,
        receipt: o.mpesaReceipt,
        phone: o.phone,
        updatedAt: o.updatedAt,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: (u._id as any).toString(),
        email: u.email,
        name: u.name,
        hasPaidAccess: u.hasPaidAccess,
        emailVerified: u.emailVerified !== false,
        createdAt: u.createdAt,
      })),
      recentServiceEvents: recentServiceEvents.map((e) => ({
        id: (e._id as any).toString(),
        service: e.service,
        level: e.level,
        code: e.code,
        message: e.message,
        statusCode: e.statusCode,
        createdAt: e.createdAt,
      })),
      // backward compatible alias
      recentTtsErrors: recentServiceEvents
        .filter((e) => e.service === "elevenlabs" && e.level === "error")
        .slice(0, 15)
        .map((e) => ({
          id: (e._id as any).toString(),
          code: e.code,
          message: e.message,
          statusCode: e.statusCode,
          createdAt: e.createdAt,
        })),
      recentArtists: recentArtists.map((a) => ({
        id: (a._id as any).toString(),
        displayName: a.displayName,
        email: a.email,
        modelTitle: a.modelTitle,
        modelUrl: a.modelUrl,
        status: a.status,
        paypal: a.paypal,
        mpesaPhone: a.mpesaPhone,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error("Admin error:", err);
    return NextResponse.json(
      { error: "Could not load admin data." },
      { status: 500 },
    );
  }
}
