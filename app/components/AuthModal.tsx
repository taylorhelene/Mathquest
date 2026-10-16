"use client";

import { useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  hasPaidAccess: boolean;
  role?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAuth: (user: User) => void;
};

type Mode = "login" | "register" | "otp";

export default function AuthModal({ open, onClose, onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function goLogin() {
    setMode("login");
    setError("");
    setInfo("");
    setOtp("");
  }

  function goRegister() {
    setMode("register");
    setError("");
    setInfo("");
    setOtp("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      // —— OTP verification step ——
      if (mode === "otp") {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invalid code");
          return;
        }
        onAuth(data.user);
        onClose();
        setMode("login");
        setOtp("");
        return;
      }

      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login" ? { email, password } : { email, name, password };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // After successful register → show OTP entry screen (do not close modal)
      if (mode === "register" && res.ok && data.needsVerification) {
        setInfo(
          data.message ||
            "We sent a 6-digit code to your email. Enter it below.",
        );
        setMode("otp");
        setOtp("");
        return;
      }

      // Login but email not verified yet
      if (mode === "login" && res.status === 403 && data.needsVerification) {
        setEmail(data.email || email);
        setInfo("Verify your email with the code we sent.");
        setMode("otp");
        setOtp("");
        return;
      }

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      onAuth(data.user);
      onClose();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not resend");
        return;
      }
      setInfo(data.message || "A new code was sent.");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create account"
              : "Enter verification code"}
        </h2>

        {mode === "otp" ? (
          <p className="muted">
            Type the <strong>6-digit code</strong> sent to{" "}
            <strong>{email}</strong>. Check spam if you do not see it.
          </p>
        ) : (
          <p className="muted">
            Progress and paid access follow you across devices.
          </p>
        )}

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
          )}

          {mode !== "otp" && (
            <>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>
            </>
          )}

          {/* OTP input — only on verify step */}
          {mode === "otp" && (
            <label>
              Verification code (OTP)
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="e.g. 482913"
                autoComplete="one-time-code"
                autoFocus
                style={{
                  fontSize: "1.35rem",
                  letterSpacing: "0.35em",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              />
            </label>
          )}

          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}

          <button className="button primary" type="submit" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : mode === "register"
                  ? "Send verification code"
                  : "Verify & continue"}
          </button>
        </form>

        {mode === "otp" && (
          <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              className="linkish"
              type="button"
              onClick={resend}
              disabled={loading}
            >
              Resend code
            </button>
            <button className="linkish" type="button" onClick={goLogin}>
              Back to sign in
            </button>
          </div>
        )}

        {mode !== "otp" && (
          <button
            className="linkish"
            type="button"
            onClick={() => (mode === "login" ? goRegister() : goLogin())}
          >
            {mode === "login"
              ? "Need an account? Register"
              : "Already registered? Sign in"}
          </button>
        )}
      </div>
    </div>
  );
}
