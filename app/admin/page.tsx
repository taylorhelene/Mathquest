"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  userCount: number;
  paidUsers: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenueKES: number;
  confirmedPayments: number;
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
  createdAt: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
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
        Registered users, confirmed M-Pesa payments, and revenue totals.
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
              <div className="label">Paid access</div>
              <div className="value">{stats.paidUsers}</div>
            </div>
            <div className="stat-card">
              <div className="label">Revenue (KES)</div>
              <div className="value">{stats.totalRevenueKES}</div>
            </div>
            <div className="stat-card">
              <div className="label">Confirmed</div>
              <div className="value">{stats.confirmedPayments}</div>
            </div>
            <div className="stat-card">
              <div className="label">Pending</div>
              <div className="value">{stats.pendingPayments}</div>
            </div>
            <div className="stat-card">
              <div className="label">Failed</div>
              <div className="value">{stats.failedPayments}</div>
            </div>
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

          <h2>Recent users</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Paid</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
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
