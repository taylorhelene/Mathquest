import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { artistsCollection } from "@/lib/db";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

function isAdmin(email: string, role?: string) {
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return role === "admin" || list.includes(email.toLowerCase());
}

/** List all artist submissions for admin */
export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.email, session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const col = await artistsCollection();
    const rows = await col.find({}).sort({ createdAt: -1 }).limit(100).toArray();
    return NextResponse.json({
      artists: rows.map((a) => ({
        id: (a._id as any).toString(),
        displayName: a.displayName,
        email: a.email,
        modelTitle: a.modelTitle,
        modelUrl: a.modelUrl,
        status: a.status,
        paypal: a.paypal,
        mpesaPhone: a.mpesaPhone,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** Approve or reject: { id, status: "approved" | "rejected" } */
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !isAdmin(session.email, session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = body.status;
    if (!id || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
    }

    const col = await artistsCollection();
    await col.updateOne(
      { _id: new ObjectId(id) as any },
      { $set: { status, updatedAt: new Date() } },
    );

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
