import { NextResponse } from "next/server";
import { getLesson } from "@/lib/lessons";
import { logServiceEvent } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Step-by-step hint generator.
 * Prefers hosted Gemma (OpenAI-compatible) when configured.
 * Logs success/failure for the admin analytics tab.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lessonId =
      typeof body.lessonId === "string" ? body.lessonId : "";
    const question =
      typeof body.question === "string" ? body.question : "";
    const attempt =
      typeof body.attempt === "string" ? body.attempt : "";
    const level = typeof body.level === "number" ? body.level : 1;

    const lesson = getLesson(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Unknown lesson." }, { status: 404 });
    }

    const gemmaUrl = process.env.GEMMA_API_URL;
    const gemmaKey = process.env.GEMMA_API_KEY;

    if (gemmaUrl && gemmaKey) {
      const prompt = buildPrompt(lesson, question, attempt, level);
      try {
        const res = await fetch(gemmaUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gemmaKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.GEMMA_MODEL || "gemma-2-9b-it",
            messages: [
              {
                role: "system",
                content:
                  "You are a patient maths tutor for primary and lower-secondary learners. " +
                  "Give short step-by-step hints. Never reveal the final answer on the first hint. " +
                  "Use simple language. Keep replies under 80 words.",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 150,
            temperature: 0.4,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text =
            data?.choices?.[0]?.message?.content ||
            data?.content ||
            data?.text;
          if (typeof text === "string" && text.trim()) {
            await logServiceEvent({
              service: "gemma",
              level: "info",
              code: "hint_ok",
              message: `Gemma hint level ${level} for ${lessonId}`,
              statusCode: 200,
            });
            return NextResponse.json({ hint: text.trim(), source: "gemma" });
          }
          await logServiceEvent({
            service: "gemma",
            level: "warn",
            code: "empty_response",
            message: "Gemma returned empty content; using fallback",
            statusCode: res.status,
          });
        } else {
          let detail = "";
          try {
            detail = await res.text();
          } catch {
            /* ignore */
          }
          await logServiceEvent({
            service: "gemma",
            level: "error",
            code: "upstream_error",
            message: detail.slice(0, 300) || `Gemma HTTP ${res.status}`,
            statusCode: res.status,
          });
        }
      } catch (err: any) {
        await logServiceEvent({
          service: "gemma",
          level: "error",
          code: "network_error",
          message: err?.message || "Gemma network failure",
        });
        console.error("Gemma request failed, using fallback", err);
      }
    } else {
      await logServiceEvent({
        service: "gemma",
        level: "info",
        code: "not_configured",
        message: "Gemma not configured; deterministic fallback used",
      });
    }

    const hint = fallbackHint(lesson, level);
    return NextResponse.json({ hint, source: "fallback" });
  } catch (err) {
    console.error("Tutor error:", err);
    await logServiceEvent({
      service: "gemma",
      level: "error",
      code: "route_error",
      message: "Tutor route exception",
    });
    return NextResponse.json(
      { error: "Could not generate a hint." },
      { status: 500 },
    );
  }
}

function buildPrompt(
  lesson: ReturnType<typeof getLesson>,
  question: string,
  attempt: string,
  level: number,
): string {
  return (
    `Lesson: ${lesson?.title}\n` +
    `Content summary: ${lesson?.summary}\n` +
    `Question: ${question || lesson?.question.prompt}\n` +
    `Learner attempt: ${attempt || "(none yet)"}\n` +
    `Hint level ${level} of 3. Give only the next helpful step, not the full answer.`
  );
}

function fallbackHint(
  lesson: NonNullable<ReturnType<typeof getLesson>>,
  level: number,
): string {
  const q = lesson.question;
  if (level <= 1) {
    return (
      `Read the question carefully: “${q.prompt}”. ` +
      `Look at the key idea from the lesson: ${lesson.summary} ` +
      `What information do you already know?`
    );
  }
  if (level === 2) {
    return (
      `Think about the method we used in this lesson. ` +
      `For “${lesson.title}”, remember: ${lesson.content.slice(0, 120)}… ` +
      `Try to apply that idea to the numbers in the question.`
    );
  }
  return (
    `Almost there. One of the options matches the idea we practised. ` +
    `If you eliminate the choices that clearly don’t fit the lesson, ` +
    `you’ll be left with the correct answer. You can also re-read the explanation after you try.`
  );
}
