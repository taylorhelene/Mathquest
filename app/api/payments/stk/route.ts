import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ordersCollection, usersCollection } from "@/lib/db";
import { stkPush } from "@/lib/mpesa";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

/** Price for unlocking all paid lessons (KES) */
const PAID_AMOUNT = Number(process.env.PAID_LESSON_AMOUNT || "100");

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in before purchasing." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { error: "M-Pesa phone number required (e.g. 07XXXXXXXX)." },
        { status: 400 },
      );
    }

    // Already paid?
    const users = await usersCollection();
    const user = await users.findOne({
      _id: new ObjectId(session.userId) as any,
    });
    if (user?.hasPaidAccess) {
      return NextResponse.json({
        alreadyPaid: true,
        message: "You already have full access.",
      });
    }

    const orders = await ordersCollection();
    const now = new Date();
    const orderResult = await orders.insertOne({
      userId: session.userId,
      email: session.email,
      amount: PAID_AMOUNT,
      currency: "KES",
      status: "pending",
      phone,
      createdAt: now,
      updatedAt: now,
    });

    const orderId = orderResult.insertedId.toString();

    // If M-Pesa not configured, keep the pending order and return a clear message
    if (
      !process.env.MPESA_CONSUMER_KEY ||
      !process.env.MPESA_CONSUMER_SECRET
    ) {
      return NextResponse.json({
        orderId,
        pending: true,
        message:
          "M-Pesa is not configured on this server. Order recorded as pending for testing.",
        amount: PAID_AMOUNT,
      });
    }

    const stk = await stkPush({
      phone,
      amount: PAID_AMOUNT,
      accountReference: orderId.slice(0, 12),
      transactionDesc: "MathQuestPaid",
    });

    await orders.updateOne(
      { _id: orderResult.insertedId },
      {
        $set: {
          merchantRequestId: stk.MerchantRequestID,
          checkoutRequestId: stk.CheckoutRequestID,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      orderId,
      checkoutRequestId: stk.CheckoutRequestID,
      customerMessage: stk.CustomerMessage,
      amount: PAID_AMOUNT,
    });
  } catch (err: any) {
    console.error("STK error:", err);
    return NextResponse.json(
      { error: err?.message || "Could not start payment." },
      { status: 500 },
    );
  }
}
