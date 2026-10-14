import { NextResponse } from "next/server";
import { getLesson } from "@/lib/lessons";

export const runtime = "nodejs";

/**
 * Step-by-step hint generator.
 * Prefers a hosted Gemma (or any OpenAI-compatible) endpoint when
 * GEMMA_API_URL + GEMMA_API_KEY are set. Falls back to deterministic
 * pedagogical hints so the demo always works.
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
          return NextResponse.json({ hint: text.trim(), source: "gemma" });
        }
      }
      console.error("Gemma request failed, using fallback");
    }

    // Deterministic pedagogical fallback
    const hint = fallbackHint(lesson, level);
    return NextResponse.json({ hint, source: "fallback" });
  } catch (err) {
    console.error("Tutor error:", err);
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
  // Level 3 — stronger nudge without fully spoiling if possible
  return (
    `Almost there. One of the options matches the idea we practised. ` +
    `If you eliminate the choices that clearly don’t fit the lesson, ` +
    `you’ll be left with the correct answer. You can also re-read the explanation after you try.`
  );
}
