import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ordersCollection, usersCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

/**
 * Manual unlock for sandbox / when Daraja callback cannot reach the server
 * (e.g. localhost). Only works when:
 *   ALLOW_MANUAL_PAYMENT_CONFIRM=true
 * or MPESA is not fully configured.
 *
 * In production with a real public callback URL, leave ALLOW_MANUAL_PAYMENT_CONFIRM unset.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const allow =
    process.env.ALLOW_MANUAL_PAYMENT_CONFIRM === "true" ||
    !process.env.MPESA_CONSUMER_KEY ||
    !process.env.MPESA_CALLBACK_URL?.includes("https://");

  if (!allow) {
    return NextResponse.json(
      {
        error:
          "Manual confirm is disabled. Wait for the M-Pesa callback, or set ALLOW_MANUAL_PAYMENT_CONFIRM=true for sandbox testing.",
      },
      { status: 403 },
    );
  }

  try {
    let orderId: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.orderId === "string") orderId = body.orderId;
    } catch {
      /* optional body */
    }

    const orders = await ordersCollection();
    const filter = orderId
      ? { _id: new ObjectId(orderId) as any, userId: session.userId }
      : { userId: session.userId, status: "pending" as const };

    const order = await orders.findOne(filter, {
      sort: { createdAt: -1 },
    });

    if (!order) {
      return NextResponse.json(
        { error: "No pending order found for your account." },
        { status: 404 },
      );
    }

    await orders.updateOne(
      { _id: order._id },
      {
        $set: {
          status: "completed",
          mpesaReceipt: "MANUAL-SANDBOX",
          updatedAt: new Date(),
        },
      },
    );

    const users = await usersCollection();
    await users.updateOne(
      { _id: new ObjectId(session.userId) as any },
      { $set: { hasPaidAccess: true } },
    );

    return NextResponse.json({
      ok: true,
      hasPaidAccess: true,
      message: "Access unlocked. Paid lessons are now open.",
    });
  } catch (err) {
    console.error("Manual confirm error:", err);
    return NextResponse.json(
      { error: "Could not confirm payment." },
      { status: 500 },
    );
  }
}
