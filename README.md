# Math Quest

Interactive **3D geometry** lessons in the browser — rotate models, optional AR, tutor hints, email OTP sign-up, M-Pesa unlock, and an admin dashboard with Gemma briefing.

| Route | What |
|-------|------|
| `/` | Landing page |
| `/learn` | Lessons |
| `/artists` | 3D artist gallery + tips (PayPal / M-Pesa) |
| `/admin` | Analytics, payments, AI logs, approvals |

**Stack:** Next.js 14 · TypeScript · MongoDB Atlas · Safaricom Daraja · Render

---

## Install

Fork the repo

```bash
git clone <your-repo-url>
cd math-quest
cp .env.example .env.local
# fill in at least JWT_SECRET (and MONGODB_URI for accounts/payments)

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Run production build |

---

## Environment

Copy `.env.example` → `.env.local` (local) or set the same keys on **Render**.
Add your keys.

---

## Admin

Sign in with an email listed in `ADMIN_EMAILS`, then open `/admin`.  
Gemma (if configured) summarises highlights, what to check, and pending artist approvals.
