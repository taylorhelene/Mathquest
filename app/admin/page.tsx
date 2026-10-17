"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  userCount: number;
  paidUsers: number;
  verifiedUsers?: number;
  unverifiedUsers?: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenueKES: number;
  confirmedPayments: number;
  ttsErrors24h?: number;
  ttsErrorsTotal?: number;
  gemmaErrors24h?: number;
  gemmaErrorsTotal?: number;
  gemmaHints24h?: number;
  gemmaFallback24h?: number;
  artistsPending?: number;
  artistsApproved?: number;
};

type Payment = {
  id: string;
  email: string;
  amount: number;
  currency: string;
  receipt?: string;
  phone?: string;
  updatedAt: string;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  hasPaidAccess: boolean;
  emailVerified?: boolean;
  createdAt: string;
};

type ServiceEvent = {
  id: string;
  service: string;
  level: string;
  code?: string;
  message: string;
  statusCode?: number;
  createdAt: string;
};

type ArtistRow = {
  id: string;
  displayName: string;
  email: string;
  modelTitle: string;
  modelUrl: string;
  status: string;
  paypal?: string;
  mpesaPhone?: string;
  createdAt?: string;
};

type Tab = "overview" | "payments" | "users" | "ai" | "artists";

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [events, setEvents] = useState<ServiceEvent[]>([]);
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [insights, setInsights] = useState<{
    source: string;
    summary: string;
    highlights: string[];
    checkNow: string[];
    approvals: string[];
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin").then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Unauthorized");
        return data;
      }),
    ])
      .then(([data]) => {
        setStats(data.stats);
        setPayments(data.recentPayments || []);
        setUsers(data.recentUsers || []);
        setEvents(data.recentServiceEvents || []);
        setArtists(data.recentArtists || []);
      })
      .catch((e) => setError(e.message || "Could not load admin data."))
      .finally(() => setLoading(false));

    setInsightsLoading(true);
    fetch("/api/admin/insights")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) return;
        setInsights({
          source: d.source || "local",
          summary: d.summary || "",
          highlights: d.highlights || [],
          checkNow: d.checkNow || [],
          approvals: d.approvals || [],
        });
      })
      .catch(() => {})
      .finally(() => setInsightsLoading(false));
  }, []);

  async function setArtistStatus(id: string, status: string) {
    await fetch("/api/admin/artists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setArtists((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status } : x)),
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "users", label: "Users" },
    { id: "ai", label: "AI services" },
    { id: "artists", label: "Artists & tips" },
  ];

  return (
    <div className="admin-page admin-dash">
      <p>
        <Link href="/">← Home</Link>
        {" · "}
        <Link href="/learn">Lessons</Link>
      </p>
      <h1>Admin analytics</h1>
      <p className="muted">
        Users, M-Pesa revenue, Gemma tutor hints, ElevenLabs voice, and artist
        tip contacts (PayPal / M-Pesa).
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {(insightsLoading || insights) && (
        <section className="insights-panel">
          <div className="insights-header">
            <h2>Gemma briefing</h2>
            <span className="badge badge-gemma">
              {insightsLoading
                ? "Reading dashboard…"
                : insights?.source === "gemma"
                  ? "Powered by Gemma"
                  : "Local summary"}
            </span>
          </div>
          {insightsLoading && !insights && (
            <p className="muted">Analysing users, payments, AI logs and artist queue…</p>
          )}
          {insights && (
            <>
              <p className="insights-summary">{insights.summary}</p>
              <div className="insights-grid">
                <div className="insights-card">
                  <h3>✨ Highlights</h3>
                  <ul>
                    {insights.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="insights-card insights-check">
                  <h3>🔍 What to check</h3>
                  <ul>
                    {insights.checkNow.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
                <div className="insights-card insights-approve">
                  <h3>✅ Approvals pending</h3>
                  <ul>
                    {insights.approvals.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="button"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => setTab("artists")}
                  >
                    Open Artists & tips
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {stats && (
        <>
          <div className="admin-tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`admin-tab ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <section>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="label">Users</div>
                  <div className="value">{stats.userCount}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Verified email</div>
                  <div className="value">{stats.verifiedUsers ?? "—"}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Paid access</div>
                  <div className="value">{stats.paidUsers}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Revenue (KES)</div>
                  <div className="value">{stats.totalRevenueKES}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Gemma hints (24h)</div>
                  <div className="value">{stats.gemmaHints24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Gemma errors (24h)</div>
                  <div className="value">{stats.gemmaErrors24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">TTS errors (24h)</div>
                  <div className="value">{stats.ttsErrors24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Artists pending</div>
                  <div className="value">{stats.artistsPending ?? 0}</div>
                </div>
              </div>

              <h2>Quick snapshot</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Confirmed payments</td>
                      <td>{stats.confirmedPayments}</td>
                    </tr>
                    <tr>
                      <td>Pending payments</td>
                      <td>{stats.pendingPayments}</td>
                    </tr>
                    <tr>
                      <td>Failed payments</td>
                      <td>{stats.failedPayments}</td>
                    </tr>
                    <tr>
                      <td>Unverified emails</td>
                      <td>{stats.unverifiedUsers ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>Gemma fallbacks (24h)</td>
                      <td>{stats.gemmaFallback24h ?? 0}</td>
                    </tr>
                    <tr>
                      <td>TTS errors (all time)</td>
                      <td>{stats.ttsErrorsTotal ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Gemma errors (all time)</td>
                      <td>{stats.gemmaErrorsTotal ?? 0}</td>
                    </tr>
                    <tr>
                      <td>Artists approved</td>
                      <td>{stats.artistsApproved ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "payments" && (
            <section>
              <h2>Confirmed M-Pesa payments</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Amount</th>
                      <th>Receipt</th>
                      <th>Phone</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={5}>No confirmed payments yet.</td>
                      </tr>
                    )}
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{p.email}</td>
                        <td>
                          {p.amount} {p.currency}
                        </td>
                        <td className="mono">{p.receipt || "—"}</td>
                        <td>{p.phone || "—"}</td>
                        <td>
                          {p.updatedAt
                            ? new Date(p.updatedAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "users" && (
            <section>
              <h2>Recent users</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Verified</th>
                      <th>Paid</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={
                              u.emailVerified === false
                                ? "badge badge-warn"
                                : "badge badge-ok"
                            }
                          >
                            {u.emailVerified === false ? "No" : "Yes"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              u.hasPaidAccess
                                ? "badge badge-ok"
                                : "badge badge-muted"
                            }
                          >
                            {u.hasPaidAccess ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "ai" && (
            <section>
              <h2>Gemma + ElevenLabs</h2>
              <p className="muted small">
                Gemma powers tutor hints when <code>GEMMA_API_URL</code> is set.
                Failures fall back to built-in hints and are logged here.
                ElevenLabs failures fall back to the browser voice.
              </p>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="label">Gemma OK (24h)</div>
                  <div className="value">{stats.gemmaHints24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Gemma errors (24h)</div>
                  <div className="value">{stats.gemmaErrors24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Gemma fallbacks (24h)</div>
                  <div className="value">{stats.gemmaFallback24h ?? 0}</div>
                </div>
                <div className="stat-card">
                  <div className="label">TTS errors (24h)</div>
                  <div className="value">{stats.ttsErrors24h ?? 0}</div>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Service</th>
                      <th>Level</th>
                      <th>Code</th>
                      <th>HTTP</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          No AI events yet. Request a lesson hint or play audio
                          to generate logs.
                        </td>
                      </tr>
                    )}
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td>
                          {e.createdAt
                            ? new Date(e.createdAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={
                              e.service === "gemma"
                                ? "badge badge-gemma"
                                : "badge badge-tts"
                            }
                          >
                            {e.service}
                          </span>
                        </td>
                        <td>{e.level}</td>
                        <td className="mono">{e.code || "—"}</td>
                        <td>{e.statusCode ?? "—"}</td>
                        <td className="msg-cell">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "artists" && (
            <section>
              <h2>Artists & tip methods</h2>
              <p className="muted small">
                Approve models for the public gallery. Tip buttons use the
                PayPal link or M-Pesa number the artist provided (“Buy me a
                coffee”).
              </p>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Artist</th>
                      <th>Model</th>
                      <th>Status</th>
                      <th>Get tips (PayPal / M-Pesa)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.length === 0 && (
                      <tr>
                        <td colSpan={5}>No artist submissions yet.</td>
                      </tr>
                    )}
                    {artists.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.displayName}
                          <br />
                          <span className="muted small">{a.email}</span>
                        </td>
                        <td>
                          <a
                            href={a.modelUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {a.modelTitle}
                          </a>
                        </td>
                        <td>
                          <span
                            className={
                              a.status === "approved"
                                ? "badge badge-ok"
                                : a.status === "rejected"
                                  ? "badge badge-warn"
                                  : "badge badge-muted"
                            }
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="small">
                          {a.paypal && (
                            <div>
                              ☕ PayPal: <span className="mono">{a.paypal}</span>
                            </div>
                          )}
                          {a.mpesaPhone && (
                            <div>
                              📱 M-Pesa:{" "}
                              <span className="mono">{a.mpesaPhone}</span>
                            </div>
                          )}
                          {!a.paypal && !a.mpesaPhone && "—"}
                        </td>
                        <td className="actions-cell">
                          {a.status !== "approved" && (
                            <button
                              type="button"
                              className="button"
                              onClick={() => setArtistStatus(a.id, "approved")}
                            >
                              Approve
                            </button>
                          )}{" "}
                          {a.status !== "rejected" && (
                            <button
                              type="button"
                              className="button ghost"
                              onClick={() => setArtistStatus(a.id, "rejected")}
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
