/**
 * Safaricom Daraja STK Push + Query helpers.
 *
 * Official behaviour (Safaricom / production guides):
 * - STK Push ResponseCode "0" = prompt accepted, NOT paid.
 * - Callback / Query ResultCode 0 + ResultDesc "The service request is processed successfully." = PAID.
 * - ResultCode 1032 = cancelled by user.
 * - ResultCode 1037 = timeout / unreachable.
 *
 * Note: Some tutorials (e.g. Medium) paste ResultCode 1032 on the success
 * sample by mistake. We therefore also treat success when:
 * - ResultDesc says processed successfully, OR
 * - CallbackMetadata contains MpesaReceiptNumber
 * even if ResultCode was mis-documented.
 */

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const SHORTCODE = process.env.MPESA_SHORTCODE || "174379";
const PASSKEY = process.env.MPESA_PASSKEY || "";
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || "";
const ENV = process.env.MPESA_ENV || "sandbox";

const BASE =
  ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
    "base64",
  );
  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!res.ok) throw new Error(`M-Pesa token failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function passwordFor(ts: string): string {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString("base64");
}

export async function stkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}): Promise<{
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY || !CALLBACK_URL) {
    throw new Error("M-Pesa credentials are not fully configured");
  }

  const token = await getAccessToken();
  const ts = timestamp();

  let phone = params.phone.replace(/\s+/g, "");
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);
  if (phone.startsWith("+")) phone = phone.slice(1);

  const body = {
    BusinessShortCode: SHORTCODE,
    Password: passwordFor(ts),
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(params.amount),
    PartyA: phone,
    PartyB: SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: CALLBACK_URL,
    AccountReference: params.accountReference.slice(0, 12),
    TransactionDesc: params.transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.errorMessage || data?.ResponseDescription || "STK Push failed",
    );
  }
  return data;
}

export async function stkQuery(checkoutRequestId: string): Promise<{
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode: string | number;
  ResultDesc: string;
}> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
    throw new Error("M-Pesa credentials are not fully configured");
  }

  const token = await getAccessToken();
  const ts = timestamp();

  const res = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: SHORTCODE,
      Password: passwordFor(ts),
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.errorMessage || data?.ResponseDescription || "STK Query failed",
    );
  }
  return data;
}

/**
 * Decide if a callback or query payload means the customer paid.
 *
 * Success signals (any one is enough):
 * 1. ResultCode is 0 (official Daraja)
 * 2. ResultDesc contains "processed successfully" (matches your tests + Medium wording)
 * 3. CallbackMetadata includes MpesaReceiptNumber (money actually moved)
 *
 * Explicit failures:
 * - ResultDesc says cancelled / timeout, without a receipt
 * - ResultCode 1032 with cancelled wording
 * - ResultCode 1037 timeout
 */
export function isPaymentSuccess(payload: {
  ResultCode?: string | number;
  ResultDesc?: string;
  CallbackMetadata?: { Item?: Array<{ Name: string; Value?: unknown }> };
}): boolean {
  const desc = (payload.ResultDesc || "").toLowerCase();
  const code = String(payload.ResultCode ?? "");

  const items = payload.CallbackMetadata?.Item || [];
  const hasReceipt = items.some(
    (i) => i.Name === "MpesaReceiptNumber" && i.Value != null && i.Value !== "",
  );
  if (hasReceipt) return true;

  if (desc.includes("processed successfully")) return true;

  if (code === "0") return true;

  return false;
}

export function interpretResult(
  payload: {
    ResultCode?: string | number;
    ResultDesc?: string;
    CallbackMetadata?: { Item?: Array<{ Name: string; Value?: unknown }> };
  },
): "completed" | "failed" | "pending" {
  if (isPaymentSuccess(payload)) return "completed";

  const code = String(payload.ResultCode ?? "");
  const desc = (payload.ResultDesc || "").toLowerCase();

  // Still in flight on some query responses
  if (code === "4999") return "pending";

  if (
    code === "1032" ||
    code === "1037" ||
    code === "1019" ||
    code === "1" ||
    code === "2001" ||
    desc.includes("cancelled") ||
    desc.includes("timeout") ||
    desc.includes("insufficient")
  ) {
    return "failed";
  }

  // Unknown non-success code → treat as failed terminal for safety
  if (code && code !== "0") return "failed";

  return "pending";
}

export function resultMessage(payload: {
  ResultCode?: string | number;
  ResultDesc?: string;
}): string {
  if (isPaymentSuccess(payload)) return "Payment successful.";
  const code = String(payload.ResultCode ?? "");
  const desc = payload.ResultDesc || "";
  if (code === "1032" || desc.toLowerCase().includes("cancelled")) {
    return "Request cancelled by user.";
  }
  if (code === "1037" || desc.toLowerCase().includes("timeout")) {
    return "Timeout — user could not be reached. Try again.";
  }
  if (code === "1") return "Insufficient M-Pesa balance.";
  if (code === "2001") return "Wrong PIN.";
  return desc || `Payment not completed (code ${code}).`;
}
