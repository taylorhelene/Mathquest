"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
};

export default function PayModal({ open, onClose, onUnlocked }: Props) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  if (!open) return null;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Payment could not start");
        return;
      }
      if (data.alreadyPaid) {
        setMessage(data.message);
        onUnlocked();
        return;
      }
      if (data.orderId) setOrderId(data.orderId);
      setMessage(
        data.customerMessage ||
          "STK sent. Enter your M-Pesa PIN on your phone, then tap “I’ve paid — check status”. (STK ResponseCode 0 only means the prompt was sent, not that you paid yet.)",
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function checkStatus() {
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/payments/status");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not check status");
        return;
      }
      if (data.hasPaidAccess) {
        setMessage(
          data.queryMessage || "Payment confirmed! Paid lessons are unlocked.",
        );
        onUnlocked();
        return;
      }
      if (data.queryMessage) {
        setMessage(data.queryMessage);
      }
      const latest = (data.orders || [])[0];
      if (latest?.status === "failed") {
        setMessage(
          latest.resultDesc ||
            `Payment failed${latest.resultCode ? ` (code ${latest.resultCode})` : ""}. Try again.`,
        );
      } else if (latest?.status === "pending") {
        setMessage(
          (data.queryMessage ? data.queryMessage + " " : "") +
            "Still pending. Enter PIN if the prompt is open, wait ~10s, then check again. On localhost the callback often cannot reach you — use “Unlock for testing”.",
        );
      } else {
        setMessage("No completed payment yet.");
      }
    } catch {
      setError("Network error while checking status.");
    } finally {
      setChecking(false);
    }
  }

  async function unlockSandbox() {
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/payments/confirm-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Manual unlock failed");
        return;
      }
      setMessage(data.message || "Unlocked!");
      onUnlocked();
    } catch {
      setError("Network error.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Unlock paid lessons</h2>
        <p className="muted">
          Pay with M-Pesa STK Push. Success is only when ResultCode is 0 after
          you enter your PIN — not when the prompt is first sent.
        </p>
        <form onSubmit={pay}>
          <label>
            M-Pesa phone number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <button className="button primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Pay with M-Pesa"}
          </button>
        </form>
        <div className="pay-extra-actions">
          <button
            className="button"
            type="button"
            onClick={checkStatus}
            disabled={checking}
          >
            {checking ? "Checking…" : "I’ve paid — check status"}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={unlockSandbox}
            disabled={checking}
          >
            Unlock for testing (sandbox)
          </button>
        </div>
        <p className="muted small">
          Codes: 0 = success · 1032 = cancelled · 1037 = timeout. Callback URL
          must be public HTTPS for automatic unlock.
        </p>
        <button className="linkish" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
