"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Artist = {
  id: string;
  displayName: string;
  bio?: string;
  modelUrl: string;
  modelTitle: string;
  license?: string;
  thumbnailUrl?: string;
  paypal?: string;
  mpesaPhone?: string;
};

function paypalHref(paypal: string): string {
  const p = paypal.trim();
  if (p.startsWith("http")) return p;
  if (p.includes("@")) {
    return `https://www.paypal.com/donate/?business=${encodeURIComponent(p)}&currency_code=USD`;
  }
  // paypal.me username
  const user = p.replace(/^@/, "").replace(/^paypal\.me\//i, "");
  return `https://paypal.me/${user}`;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  // form
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [modelTitle, setModelTitle] = useState("");
  const [modelUrl, setModelUrl] = useState("");
  const [bio, setBio] = useState("");
  const [license, setLicense] = useState("");
  const [paypal, setPaypal] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    fetch("/api/artists")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Failed");
        setArtists(d.artists || []);
      })
      .catch((e) => setError(e.message || "Could not load gallery"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    setFormMsg("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          modelTitle,
          modelUrl,
          bio,
          license,
          paypal,
          mpesaPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormErr(data.error || "Submit failed");
        return;
      }
      setFormMsg(data.message);
      setDisplayName("");
      setEmail("");
      setModelTitle("");
      setModelUrl("");
      setBio("");
      setLicense("");
      setPaypal("");
      setMpesaPhone("");
    } catch {
      setFormErr("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function copyMpesa(phone: string) {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopied(phone);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  return (
    <div className="admin-page" style={{ maxWidth: 720 }}>
      <p>
        <Link href="/">← Back to Math Quest</Link>
      </p>
      <h1>🎨 3D artists</h1>
      <p className="muted">
        Community models for Math Quest. Support creators with PayPal or M-Pesa.
        We store <strong>links and tip details</strong> in the database — not the
        large .glb files themselves (host your file on Sketchfab, GitHub, or a
        CDN and paste the URL).
      </p>

      <h2>Gallery</h2>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && artists.length === 0 && (
        <p className="muted">No approved models yet. Be the first to submit!</p>
      )}
      <div className="artist-grid">
        {artists.map((a) => (
          <article key={a.id} className="artist-card">
            <h3>{a.modelTitle}</h3>
            <p className="muted small">by {a.displayName}</p>
            {a.bio && <p className="small">{a.bio}</p>}
            {a.license && (
              <p className="model-credit">License: {a.license}</p>
            )}
            <div className="pay-extra-actions">
              <a
                className="button"
                href={a.modelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open 3D model
              </a>
              {a.paypal && (
                <a
                  className="button primary"
                  href={paypalHref(a.paypal)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ☕ Buy me a coffee (PayPal)
                </a>
              )}
              {a.mpesaPhone && (
                <button
                  type="button"
                  className="button"
                  onClick={() => copyMpesa(a.mpesaPhone!)}
                >
                  {copied === a.mpesaPhone
                    ? "Copied!"
                    : `📱 M-Pesa: ${a.mpesaPhone}`}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: "2rem" }}>Submit your model</h2>
      <p className="muted small">
        Host your .glb online, then paste the public URL. Submissions stay{" "}
        <strong>pending</strong> until an admin approves them.
      </p>
      <form onSubmit={submit} className="artist-form">
        <label>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Model title
          <input
            value={modelTitle}
            onChange={(e) => setModelTitle(e.target.value)}
            required
            placeholder="e.g. Classroom cube"
          />
        </label>
        <label>
          Model URL (.glb / page link)
          <input
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            required
            placeholder="https://..."
          />
        </label>
        <label>
          Short bio (optional)
          <input value={bio} onChange={(e) => setBio(e.target.value)} />
        </label>
        <label>
          License (optional)
          <input
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="CC-BY, CC0, ..."
          />
        </label>
        <label>
          PayPal (email or paypal.me name)
          <input
            value={paypal}
            onChange={(e) => setPaypal(e.target.value)}
            placeholder="you@email.com or YourName"
          />
        </label>
        <label>
          M-Pesa number
          <input
            value={mpesaPhone}
            onChange={(e) => setMpesaPhone(e.target.value)}
            placeholder="07XXXXXXXX"
          />
        </label>
        {formErr && <p className="error">{formErr}</p>}
        {formMsg && <p className="success">{formMsg}</p>}
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? "Sending…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
