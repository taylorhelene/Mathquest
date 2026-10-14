import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ordersCollection, usersCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { stkQuery, interpretResult, resultMessage } from "@/lib/mpesa";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const users = await usersCollection();
    const user = await users.findOne({
      _id: new ObjectId(session.userId) as any,
    });

    const orders = await ordersCollection();
    const recent = await orders
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    let hasPaidAccess = Boolean(user?.hasPaidAccess);
    let queryMessage = "";

    if (!hasPaidAccess) {
      const pending = recent.find(
        (o) => o.status === "pending" && o.checkoutRequestId,
      );
      if (pending?.checkoutRequestId && process.env.MPESA_CONSUMER_KEY) {
        try {
          const q = await stkQuery(pending.checkoutRequestId);
          const status = interpretResult(q);
          queryMessage = resultMessage(q);

          if (status === "completed") {
            await orders.updateOne(
              { _id: pending._id },
              {
                $set: {
                  status: "completed",
                  resultCode: String(q.ResultCode),
                  resultDesc: q.ResultDesc,
                  updatedAt: new Date(),
                },
              },
            );
            await users.updateOne(
              { _id: new ObjectId(session.userId) as any },
              { $set: { hasPaidAccess: true } },
            );
            hasPaidAccess = true;
          } else if (status === "failed") {
            await orders.updateOne(
              { _id: pending._id },
              {
                $set: {
                  status: "failed",
                  resultCode: String(q.ResultCode),
                  resultDesc: q.ResultDesc,
                  updatedAt: new Date(),
                },
              },
            );
          }
        } catch (err) {
          console.error("STK query error:", err);
          queryMessage =
            "Could not query M-Pesa yet. Wait a few seconds and try again.";
        }
      }
    }

    const refreshed = await orders
      .find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      hasPaidAccess,
      queryMessage,
      orders: refreshed.map((o) => ({
        id: (o._id as any).toString(),
        status: o.status,
        amount: o.amount,
        resultCode: (o as any).resultCode,
        resultDesc: (o as any).resultDesc,
        createdAt: o.createdAt,
        checkoutRequestId: o.checkoutRequestId,
      })),
    });
  } catch (err) {
    console.error("Payment status error:", err);
    return NextResponse.json(
      { error: "Could not load payment status." },
      { status: 500 },
    );
  }
}
