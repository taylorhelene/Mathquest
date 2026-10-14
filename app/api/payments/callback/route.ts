import { NextResponse } from "next/server";
import { ordersCollection, usersCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { interpretResult } from "@/lib/mpesa";

export const runtime = "nodejs";

/**
 * Daraja posts the final STK result here.
 * Success = ResultCode 0 OR ResultDesc "processed successfully"
 *           OR CallbackMetadata has MpesaReceiptNumber.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("M-Pesa callback:", JSON.stringify(body));

    const stkCallback = body?.Body?.stkCallback;
    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const merchantRequestId = stkCallback.MerchantRequestID;
    const resultDesc = stkCallback.ResultDesc || "";
    const resultCode = stkCallback.ResultCode;

    const orders = await ordersCollection();
    const order = await orders.findOne({
      $or: [{ checkoutRequestId }, { merchantRequestId }],
    });

    if (!order) {
      console.warn("Callback for unknown order", checkoutRequestId);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    if (order.status === "completed") {
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    const status = interpretResult(stkCallback);

    if (status === "completed") {
      const items = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = items.find(
        (i: { Name: string }) => i.Name === "MpesaReceiptNumber",
      );
      const receipt = receiptItem?.Value;

      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "completed",
            mpesaReceipt: receipt ? String(receipt) : undefined,
            resultCode: String(resultCode),
            resultDesc,
            updatedAt: new Date(),
          },
        },
      );

      const users = await usersCollection();
      await users.updateOne(
        { _id: new ObjectId(order.userId) as any },
        { $set: { hasPaidAccess: true } },
      );
    } else if (status === "failed") {
      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "failed",
            resultCode: String(resultCode),
            resultDesc,
            updatedAt: new Date(),
          },
        },
      );
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
