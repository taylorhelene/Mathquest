"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LESSONS, type Lesson } from "@/lib/lessons";
import ARViewer from "../components/ARViewer";
import AuthModal from "../components/AuthModal";
import PayModal from "../components/PayModal";
import LessonVisual from "../components/LessonVisual";

type User = {
  id: string;
  email: string;
  name: string;
  hasPaidAccess: boolean;
  role?: string;
};

type ProgressItem = {
  lessonId: string;
  attempts: number;
  correct: boolean;
};

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const saved = localStorage.getItem("mq-theme") as "dark" | "light" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("mq-theme", next);
      return next;
    });
  }

  return { theme, toggle };
}

function speakBrowser(text: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [selectedId, setSelectedId] = useState(LESSONS[0].id);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hint, setHint] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [hintLoading, setHintLoading] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const lesson = useMemo(
    () => LESSONS.find((l) => l.id === selectedId) || LESSONS[0],
    [selectedId],
  );

  const completedIds = useMemo(
    () => new Set(progress.filter((p) => p.correct).map((p) => p.lessonId)),
    [progress],
  );

  const canAccess = useCallback(
    (l: Lesson) => l.free || Boolean(user?.hasPaidAccess),
    [user],
  );

  async function refreshUser() {
    try {
      const r = await fetch("/api/auth/me");
      const d = await r.json();
      if (d.user) setUser(d.user);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refreshUser();
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.progress)) setProgress(d.progress);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedOption(null);
    setAnswered(false);
    setIsCorrect(false);
    setHint("");
    setHintLevel(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [selectedId]);

  async function speakLesson() {
    if (!audioOn) return;
    setAudioLoading(true);
    const fallbackText = `${lesson.title}. ${lesson.summary}`;
    try {
      const text = `${lesson.title}. ${lesson.content}`;
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 2400) }),
      });

      if (res.status === 503 || res.status === 402 || res.status === 429) {
        let msg = "Using device voice.";
        try {
          const err = await res.json();
          if (err.code === "quota") {
            msg =
              "ElevenLabs quota/billing (402). Using device voice. Add credits at elevenlabs.io.";
          } else if (err.code === "not_configured") {
            msg = "Using device voice (ElevenLabs not configured).";
          } else if (err.code === "rate_limit") {
            msg = "ElevenLabs busy — using device voice.";
          }
        } catch {
          /* ignore */
        }
        speakBrowser(fallbackText);
        setStatusMsg(msg);
        return;
      }

      if (!res.ok) {
        speakBrowser(fallbackText);
        setStatusMsg("ElevenLabs failed — using device voice.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();
      setStatusMsg("");
    } catch {
      speakBrowser(fallbackText);
      setStatusMsg("Audio error — used device voice.");
    } finally {
      setAudioLoading(false);
    }
  }

  async function requestHint() {
    setHintLoading(true);
    const nextLevel = Math.min(hintLevel + 1, 3);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          question: lesson.question.prompt,
          attempt:
            selectedOption !== null
              ? lesson.question.options[selectedOption]
              : "",
          level: nextLevel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.hint) {
        setHint(data.hint);
        setHintLevel(nextLevel);
      } else {
        setHint("Could not load a hint right now. Try again in a moment.");
      }
    } catch {
      setHint("Network error while fetching hint.");
    } finally {
      setHintLoading(false);
    }
  }

  async function submitAnswer() {
    if (selectedOption === null || answered) return;
    const correct = selectedOption === lesson.question.correctIndex;
    setIsCorrect(correct);
    setAnswered(true);

    if (user) {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id, correct }),
        });
        setProgress((prev) => {
          const others = prev.filter((p) => p.lessonId !== lesson.id);
          const existing = prev.find((p) => p.lessonId === lesson.id);
          return [
            ...others,
            {
              lessonId: lesson.id,
              attempts: (existing?.attempts || 0) + 1,
              correct: existing?.correct || correct,
            },
          ];
        });
      } catch {
        /* offline / no db */
      }
    }
  }

  async function signOut() {
    await fetch("/api/auth/me", { method: "DELETE" });
    setUser(null);
    setProgress([]);
  }

  function selectLesson(l: Lesson) {
    if (!canAccess(l)) {
      if (!user) {
        setAuthOpen(true);
        setStatusMsg("Sign in, then unlock paid lessons.");
      } else {
        setPayOpen(true);
      }
      return;
    }
    setSelectedId(l.id);
    setStatusMsg("");
  }

  async function onPaymentUnlocked() {
    await refreshUser();
    setStatusMsg("Full access unlocked — paid lessons are open.");
    setPayOpen(false);
  }

  const freeCount = LESSONS.filter((l) => l.free).length;
  const doneCount = LESSONS.filter(
    (l) => l.free && completedIds.has(l.id),
  ).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            📚
          </span>
          <div>
            <strong>📘 Math Quest ✨</strong>
            <span className="tag">🧮 Learn · 🎮 Play · 📱 AR</span>
          </div>
        </div>
        <div className="top-actions">
          <button
            className="button ghost theme-toggle"
            onClick={toggleTheme}
            type="button"
            title="Toggle light / dark"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <label className="toggle">
            <input
              type="checkbox"
              checked={audioOn}
              onChange={(e) => setAudioOn(e.target.checked)}
            />
            Audio
          </label>
          {user ? (
            <>
              <span className="user-chip">
                {user.name}
                {user.hasPaidAccess ? " · Full access" : ""}
              </span>
              <a className="button ghost" href="/admin">
                Admin
              </a>
              <button className="button ghost" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className="button" onClick={() => setAuthOpen(true)}>
              Sign in
            </button>
          )}
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="progress-card">
            <h3>Your progress</h3>
            <p>
              {doneCount} / {freeCount} free lessons mastered
            </p>
            <div className="bar">
              <div
                className="bar-fill"
                style={{
                  width: `${freeCount ? (doneCount / freeCount) * 100 : 0}%`,
                }}
              />
            </div>
            {!user && (
              <p className="muted small">
                Sign in to save progress across devices.
              </p>
            )}
          </div>

          <h3 className="list-title">Lessons</h3>
          <ul className="lesson-list">
            {LESSONS.map((l) => {
              const locked = !canAccess(l);
              const done = completedIds.has(l.id);
              return (
                <li key={l.id}>
                  <button
                    className={`lesson-item ${
                      selectedId === l.id ? "active" : ""
                    } ${locked ? "locked" : ""} ${done ? "done" : ""}`}
                    onClick={() => selectLesson(l)}
                  >
                    <span className="num">{l.number}</span>
                    <span className="meta">
                      <strong>{l.title}</strong>
                      <span className="topic">{l.topic}</span>
                    </span>
                    {locked ? (
                      <span className="badge lock">🔒</span>
                    ) : done ? (
                      <span className="badge ok">✓</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="lesson-panel">
          <div className="lesson-header">
            <div>
              <p className="eyebrow">
                Lesson {lesson.number} · {lesson.topic}
                {!lesson.free && " · Paid"}
              </p>
              <h1>{lesson.title}</h1>
              <p className="summary">{lesson.summary}</p>
            </div>
            <div className="header-actions">
              <button
                className="button"
                onClick={speakLesson}
                disabled={audioLoading || !audioOn}
              >
                {audioLoading ? "Loading…" : "Play lesson audio"}
              </button>
            </div>
          </div>

          <article className="content-block">
            <p>{lesson.content}</p>
          </article>

          {/* Educational visual for EVERY lesson (no GLB required) */}
          <LessonVisual
            lessonId={lesson.id}
            title={lesson.title}
            topic={lesson.topic}
            modelSrc={lesson.modelSrc}
            shapeHint={(lesson as { shapeHint?: string }).shapeHint}
          />

          {/* Optional real 3D / AR when a model URL is set */}
          {lesson.modelSrc && (
            <ARViewer
              title={lesson.title}
              modelSrc={lesson.modelSrc}
              modelCredit={lesson.modelCredit}
            />
          )}

          <div className="challenge">
            <h2>Try it</h2>
            <p className="prompt">{lesson.question.prompt}</p>
            <div className="options">
              {lesson.question.options.map((opt, i) => (
                <button
                  key={i}
                  className={`option ${
                    selectedOption === i ? "selected" : ""
                  } ${
                    answered
                      ? i === lesson.question.correctIndex
                        ? "correct"
                        : selectedOption === i
                          ? "wrong"
                          : ""
                      : ""
                  }`}
                  onClick={() => !answered && setSelectedOption(i)}
                  disabled={answered}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="challenge-actions">
              <button
                className="button primary"
                onClick={submitAnswer}
                disabled={selectedOption === null || answered}
              >
                Check answer
              </button>
              <button
                className="button ghost"
                onClick={requestHint}
                disabled={hintLoading || hintLevel >= 3}
              >
                {hintLoading
                  ? "Thinking…"
                  : hintLevel === 0
                    ? "Get a hint"
                    : `Hint ${hintLevel}/3`}
              </button>
            </div>

            {hint && (
              <div className="hint-box">
                <strong>Tutor hint</strong>
                <p>{hint}</p>
              </div>
            )}

            {answered && (
              <div className={`feedback ${isCorrect ? "good" : "bad"}`}>
                {isCorrect ? (
                  <p>
                    Correct! {lesson.question.explanation}
                    {!user && " Sign in to save this progress."}
                  </p>
                ) : (
                  <p>
                    Not quite. {lesson.question.explanation} Try another lesson
                    or request another hint next time.
                  </p>
                )}
              </div>
            )}
          </div>

          {statusMsg && <p className="status">{statusMsg}</p>}
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo">📚</span>
            <div>
              <strong>Math Quest</strong>
              <p className="muted small">Interactive 3D maths lessons.</p>
            </div>
          </div>
          <div className="footer-cols">
            <div>
              <h4>Navigate</h4>
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/learn">Lessons</a>
                </li>
                <li>
                  <a href="/artists">Artists gallery</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li>
                  <a href="/admin">Admin</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="/artists">Submit a 3D model</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© Math Quest · Learn · Play · AR</p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={(u) => {
          setUser(u);
          fetch("/api/progress")
            .then((r) => r.json())
            .then((d) => {
              if (Array.isArray(d.progress)) setProgress(d.progress);
            })
            .catch(() => {});
        }}
      />
      <PayModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onUnlocked={onPaymentUnlocked}
        isAdmin={user?.role === "admin"}
      />
    </div>
  );
}
