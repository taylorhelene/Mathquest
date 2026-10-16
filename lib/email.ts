/**
 * Email helpers for signup OTP.
 * Supports Resend (recommended on Render) or logs OTP in development.
 */

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpEmail(
  to: string,
  otp: string,
  name?: string,
): Promise<{ ok: boolean; mode: "resend" | "dev_log"; error?: string }> {
  const from =
    process.env.EMAIL_FROM || "Math Quest <onboarding@resend.dev>";
  const subject = "Your Math Quest verification code";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <h2>📘 Math Quest</h2>
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#64748b;font-size:13px">If you did not sign up for Math Quest, ignore this email.</p>
    </div>
  `;
  const text = `Your Math Quest verification code is ${otp}. It expires in 10 minutes.`;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error("Resend error:", res.status, body);
        return { ok: false, mode: "resend", error: body };
      }
      return { ok: true, mode: "resend" };
    } catch (err: any) {
      console.error("Resend send failed:", err);
      return { ok: false, mode: "resend", error: err?.message };
    }
  }

  // Development fallback — OTP printed in server logs only
  console.log(`[Math Quest OTP] to=${to} code=${otp}`);
  return { ok: true, mode: "dev_log" };
}
