import { NextResponse } from "next/server";
import { artistsCollection } from "@/lib/db";

export const runtime = "nodejs";

/** Public list of approved artist models */
export async function GET() {
  try {
    const col = await artistsCollection();
    const rows = await col
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      artists: rows.map((a) => ({
        id: (a._id as any).toString(),
        displayName: a.displayName,
        bio: a.bio,
        modelUrl: a.modelUrl,
        modelTitle: a.modelTitle,
        license: a.license,
        thumbnailUrl: a.thumbnailUrl,
        paypal: a.paypal,
        mpesaPhone: a.mpesaPhone,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error("Artists list error:", err);
    return NextResponse.json(
      { error: "Could not load artists. Is MongoDB configured?" },
      { status: 500 },
    );
  }
}

/** Artist self-registration (pending until admin approves) */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const modelTitle =
      typeof body.modelTitle === "string" ? body.modelTitle.trim() : "";
    const modelUrl =
      typeof body.modelUrl === "string" ? body.modelUrl.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 500) : "";
    const license =
      typeof body.license === "string" ? body.license.trim().slice(0, 120) : "";
    const thumbnailUrl =
      typeof body.thumbnailUrl === "string" ? body.thumbnailUrl.trim() : "";
    const paypal =
      typeof body.paypal === "string" ? body.paypal.trim().slice(0, 120) : "";
    const mpesaPhone =
      typeof body.mpesaPhone === "string"
        ? body.mpesaPhone.trim().slice(0, 20)
        : "";

    if (!displayName || !email || !modelTitle || !modelUrl) {
      return NextResponse.json(
        {
          error:
            "Display name, email, model title and model URL (link to .glb) are required.",
        },
        { status: 400 },
      );
    }

    // Basic URL check
    try {
      const u = new URL(modelUrl);
      if (!["http:", "https:"].includes(u.protocol)) {
        throw new Error("bad protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "modelUrl must be a valid http(s) link to your model." },
        { status: 400 },
      );
    }

    if (!paypal && !mpesaPhone) {
      return NextResponse.json(
        {
          error:
            "Add at least one appreciation method: PayPal email/username or M-Pesa number.",
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const col = await artistsCollection();
    const result = await col.insertOne({
      displayName,
      email,
      bio: bio || undefined,
      modelUrl,
      modelTitle,
      license: license || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
      paypal: paypal || undefined,
      mpesaPhone: mpesaPhone || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    } as any);

    return NextResponse.json({
      ok: true,
      id: result.insertedId.toString(),
      message:
        "Thanks! Your model was submitted and is pending review. It will appear in the gallery after approval.",
    });
  } catch (err) {
    console.error("Artist register error:", err);
    return NextResponse.json(
      { error: "Could not save submission. Is MongoDB configured?" },
      { status: 500 },
    );
  }
}
