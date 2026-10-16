import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  usersCollection,
  ordersCollection,
  serviceEventsCollection,
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
    const recentTtsErrors = await events
      .find({ service: "elevenlabs", level: "error" })
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    const recentUsers = await users
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .project({ passwordHash: 0, otpHash: 0 })
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
      recentTtsErrors: recentTtsErrors.map((e) => ({
        id: (e._id as any).toString(),
        code: e.code,
        message: e.message,
        statusCode: e.statusCode,
        createdAt: e.createdAt,
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
