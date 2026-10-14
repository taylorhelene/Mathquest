import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { usersCollection, ordersCollection } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simple admin gate: role === admin OR ADMIN_EMAILS env list
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

    const userCount = await users.countDocuments();
    const paidUsers = await users.countDocuments({ hasPaidAccess: true });

    const completed = await orders
      .find({ status: "completed" })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    const pending = await orders.countDocuments({ status: "pending" });
    const failed = await orders.countDocuments({ status: "failed" });

    const totalRevenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0);

    const recentUsers = await users
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .project({ passwordHash: 0 })
      .toArray();

    return NextResponse.json({
      stats: {
        userCount,
        paidUsers,
        pendingPayments: pending,
        failedPayments: failed,
        totalRevenueKES: totalRevenue,
        confirmedPayments: completed.length,
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
        createdAt: u.createdAt,
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
