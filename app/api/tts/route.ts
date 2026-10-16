import { NextResponse } from "next/server";
import { logServiceEvent } from "@/lib/db";

export const runtime = "nodejs";

async function recordFailure(
  code: string,
  message: string,
  statusCode?: number,
) {
  await logServiceEvent({
    service: "elevenlabs",
    level: "error",
    code,
    message,
    statusCode,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    await recordFailure(
      "not_configured",
      "ElevenLabs is not configured on the server.",
      503,
    );
    return NextResponse.json(
      {
        error: "ElevenLabs is not configured on the server.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
      ? ((body as { text: string }).text).trim()
      : "";

  if (!text || text.length > 2500) {
    return NextResponse.json(
      { error: "Text must be between 1 and 2500 characters." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );

  if (!response.ok) {
    const status = response.status;
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      /* ignore */
    }
    console.error("ElevenLabs request failed:", status, detail);

    if (status === 401) {
      await recordFailure("unauthorized", "Invalid ElevenLabs API key", 401);
      return NextResponse.json(
        { error: "ElevenLabs API key is invalid.", code: "unauthorized" },
        { status: 502 },
      );
    }
    if (status === 402) {
      await recordFailure(
        "quota",
        "ElevenLabs quota or billing issue (HTTP 402)",
        402,
      );
      return NextResponse.json(
        {
          error:
            "ElevenLabs quota or billing issue (HTTP 402). Add credits at elevenlabs.io.",
          code: "quota",
        },
        { status: 402 },
      );
    }
    if (status === 429) {
      await recordFailure("rate_limit", "ElevenLabs rate limit", 429);
      return NextResponse.json(
        {
          error: "ElevenLabs rate limit — try again in a moment.",
          code: "rate_limit",
        },
        { status: 429 },
      );
    }

    await recordFailure(
      "upstream_error",
      detail || `ElevenLabs upstream error ${status}`,
      status,
    );
    return NextResponse.json(
      {
        error: "Could not generate lesson audio.",
        code: "upstream_error",
        upstreamStatus: status,
      },
      { status: 502 },
    );
  }

  const audio = await response.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
