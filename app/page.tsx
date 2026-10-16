"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("mq-theme") as "light" | "dark" | null;
    const initial = saved || "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("mq-theme", next);
      return next;
    });
  }

  return (
    <div className="landing">
      <header className="landing-top">
        <div className="brand">
          <span className="logo" aria-hidden>
            📚
          </span>
          <div>
            <strong>📘 Math Quest ✨</strong>
            <span className="tag">3D · AR · Learn by doing</span>
          </div>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="button ghost theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <Link className="button" href="/learn">
            Lessons
          </Link>
          <Link className="button primary" href="/learn">
            Start learning
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">For curious minds in Kenya & beyond</p>
          <h1>
            Open the book.
            <br />
            Step into <span className="hero-accent">3D maths</span>.
          </h1>
          <p className="hero-lead">
            Math Quest turns cubes, spheres, cones and compasses into short
            interactive quests. Rotate real 3D models, try AR on your phone, get
            gentle hints, and unlock more lessons with M-Pesa.
          </p>
          <div className="hero-cta">
            <Link className="button primary cta-lg" href="/learn">
              Start learning →
            </Link>
            <Link className="button cta-lg" href="/artists">
              🎨 Artists gallery
            </Link>
          </div>
          <ul className="hero-bullets">
            <li>10 free 3D geometry lessons</li>
            <li>Optional AR on supported phones</li>
            <li>Tutor hints · progress · M-Pesa unlock</li>
          </ul>
        </div>

        <div className="hero-book" aria-hidden="true">
          <div className="book">
            <div className="book-cover">
              <span className="book-title">Math<br />Quest</span>
              <span className="book-sub">3D solids</span>
            </div>
            <div className="book-page page1">
              <span>⬛ Cube</span>
              <span>🔵 Sphere</span>
            </div>
            <div className="book-page page2">
              <span>🔺 Cone</span>
              <span>🧭 Compass</span>
            </div>
            <div className="book-page page3">
              <span>📐 Pyramid</span>
              <span>🥤 Cylinder</span>
            </div>
          </div>
          <p className="book-caption">Watch the pages turn — then open the real lessons</p>
        </div>
      </section>

      <section className="features">
        <h2>What’s inside</h2>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">🧊</div>
            <h3>3D shapes you can spin</h3>
            <p>
              Cubes, spheres, cuboids, cylinders, cones, pyramids and more —
              with diagrams and optional GLB models in AR.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Hints, not spoilers</h3>
            <p>
              Stuck on a question? Ask for step-by-step tutor hints that guide
              without giving away the answer too early.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Built for phones</h3>
            <p>
              Works in the browser on phone, tablet or computer — no app store
              required. Audio and progress when you sign in.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>M-Pesa when you’re ready</h3>
            <p>
              Ten lessons free. Unlock the rest with a real Safaricom STK
              payment — only confirmed payments open paid content.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-cta-band">
        <h2>Ready to explore?</h2>
        <p className="muted">Jump into lesson one — Meet the Cube.</p>
        <Link className="button primary cta-lg" href="/learn">
          Start learning →
        </Link>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo">📚</span>
            <div>
              <strong>Math Quest</strong>
              <p className="muted small">
                Interactive 3D maths for learners. Built with Next.js, MongoDB,
                and optional AR.
              </p>
            </div>
          </div>
          <div className="footer-cols">
            <div>
              <h4>Learn</h4>
              <ul>
                <li>
                  <Link href="/learn">All lessons</Link>
                </li>
                <li>
                  <Link href="/learn">Start learning</Link>
                </li>
                <li>
                  <Link href="/artists">3D artists gallery</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li>
                  <Link href="/learn">Sign in / Register</Link>
                </li>
                <li>
                  <Link href="/admin">Admin dashboard</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Support creators</h4>
              <ul>
                <li>
                  <Link href="/artists">Submit a model</Link>
                </li>
                <li>
                  <Link href="/artists">Buy an artist a coffee</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Math Quest · Learn · Play · AR</p>
        </div>
      </footer>
    </div>
  );
}
