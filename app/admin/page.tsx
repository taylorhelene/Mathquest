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

type TtsError = {
  id: string;
  code?: string;
  message: string;
  statusCode?: number;
  createdAt: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [ttsErrors, setTtsErrors] = useState<TtsError[]>([]);
  const [artists, setArtists] = useState<
    {
      id: string;
      displayName: string;
      email: string;
      modelTitle: string;
      modelUrl: string;
      status: string;
      paypal?: string;
      mpesaPhone?: string;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Unauthorized");
          return;
        }
        setStats(data.stats);
        setPayments(data.recentPayments || []);
        setUsers(data.recentUsers || []);
        setTtsErrors(data.recentTtsErrors || []);
        fetch("/api/admin/artists")
          .then((r) => r.json())
          .then((d) => {
            if (d.artists) setArtists(d.artists);
          })
          .catch(() => {});
      })
      .catch(() => setError("Could not load admin data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <p>
        <Link href="/">← Back to lessons</Link>
      </p>
      <h1>Admin dashboard</h1>
      <p className="muted">
        Users, verified signups, M-Pesa revenue, and ElevenLabs health.
      </p>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {stats && (
        <>
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
              <div className="label">Unverified</div>
              <div className="value">{stats.unverifiedUsers ?? "—"}</div>
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
              <div className="label">Confirmed pay</div>
              <div className="value">{stats.confirmedPayments}</div>
            </div>
            <div className="stat-card">
              <div className="label">Pending pay</div>
              <div className="value">{stats.pendingPayments}</div>
            </div>
            <div className="stat-card">
              <div className="label">Failed pay</div>
              <div className="value">{stats.failedPayments}</div>
            </div>
            <div className="stat-card">
              <div className="label">TTS errors (24h)</div>
              <div className="value">{stats.ttsErrors24h ?? 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">TTS errors (all)</div>
              <div className="value">{stats.ttsErrorsTotal ?? 0}</div>
            </div>
          </div>

          <h2>ElevenLabs / voice errors</h2>
          <p className="muted small">
            Logged when lesson audio fails (quota 402, bad key, rate limit, etc.).
            Learners still hear the browser fallback voice.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Code</th>
                  <th>HTTP</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {ttsErrors.length === 0 && (
                  <tr>
                    <td colSpan={4}>No ElevenLabs errors logged yet.</td>
                  </tr>
                )}
                {ttsErrors.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>{e.code || "—"}</td>
                    <td>{e.statusCode ?? "—"}</td>
                    <td>{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Recent confirmed payments</h2>
          <div className="table-wrap">
            <table>
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
                    <td>{p.receipt || "—"}</td>
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


          <h2>Artist submissions</h2>
          <p className="muted small">
            Approve models to show them on the public{" "}
            <a href="/artists">/artists</a> gallery.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artist</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Tips</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {artists.length === 0 && (
                  <tr>
                    <td colSpan={5}>No submissions yet.</td>
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
                      <a href={a.modelUrl} target="_blank" rel="noreferrer">
                        {a.modelTitle}
                      </a>
                    </td>
                    <td>{a.status}</td>
                    <td className="small">
                      {a.paypal && <div>PayPal: {a.paypal}</div>}
                      {a.mpesaPhone && <div>M-Pesa: {a.mpesaPhone}</div>}
                    </td>
                    <td>
                      {a.status !== "approved" && (
                        <button
                          type="button"
                          className="button"
                          onClick={() => {
                            fetch("/api/admin/artists", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: a.id,
                                status: "approved",
                              }),
                            }).then(() =>
                              setArtists((prev) =>
                                prev.map((x) =>
                                  x.id === a.id
                                    ? { ...x, status: "approved" }
                                    : x,
                                ),
                              ),
                            );
                          }}
                        >
                          Approve
                        </button>
                      )}{" "}
                      {a.status !== "rejected" && (
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => {
                            fetch("/api/admin/artists", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                id: a.id,
                                status: "rejected",
                              }),
                            }).then(() =>
                              setArtists((prev) =>
                                prev.map((x) =>
                                  x.id === a.id
                                    ? { ...x, status: "rejected" }
                                    : x,
                                ),
                              ),
                            );
                          }}
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

          <h2>Recent users</h2>
          <div className="table-wrap">
            <table>
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
                    <td>{u.emailVerified === false ? "No" : "Yes"}</td>
                    <td>{u.hasPaidAccess ? "Yes" : "No"}</td>
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
        </>
      )}
    </div>
  );
}
