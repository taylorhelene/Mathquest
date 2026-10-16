"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onUnlocked: () => void;
  /** Only admins may see sandbox unlock — learners never do */
  isAdmin?: boolean;
};

export default function PayModal({
  open,
  onClose,
  onUnlocked,
  isAdmin = false,
}: Props) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

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
      setMessage(
        data.customerMessage ||
          "STK sent. Enter your M-Pesa PIN, then tap “I’ve paid — check status”.",
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
      const latest = (data.orders || [])[0];
      if (latest?.status === "failed") {
        setMessage(
          latest.resultDesc ||
            `Payment failed${latest.resultCode ? ` (code ${latest.resultCode})` : ""}. Try again.`,
        );
      } else if (latest?.status === "pending") {
        setMessage(
          (data.queryMessage ? data.queryMessage + " " : "") +
            "Still pending. Enter PIN if prompted, wait ~10s, then check again.",
        );
      } else {
        setMessage(data.queryMessage || "No completed payment yet.");
      }
    } catch {
      setError("Network error while checking status.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Unlock paid lessons</h2>
        <p className="muted">
          Pay with M-Pesa. Access unlocks only after a successful payment
          (ResultCode 0).
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
        </div>
        {isAdmin && (
          <p className="muted small">
            Admin note: sandbox manual unlock is disabled for learners. Use a
            real STK success or set hasPaidAccess in the database if needed.
          </p>
        )}
        <button className="linkish" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
