# Math Quest

Mobile-first interactive math learning site.

- **10 free lessons** + locked paid lessons
- Multiple-choice challenges with mastery-based progress
- Step-by-step **tutor hints** (Gemma-compatible API or built-in fallback)
- **ElevenLabs** lesson audio (browser voice fallback)
- **model-viewer** 3D / AR where the device supports it
- **Sign-up**, progress in **MongoDB Atlas**
- **M-Pesa STK Push** (Daraja sandbox) + callback unlock
- **Admin dashboard** (users, confirmed payments, revenue)

## Stack

- Next.js 14 (App Router) + TypeScript
- MongoDB Atlas
- Deploy target: Render

## Quick start

```bash
cd math-quest
cp .env.example .env.local
# edit .env.local with your keys

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Without external services

The UI and all 10 free lessons work with **no** MongoDB, ElevenLabs, Gemma, or M-Pesa configured:

- Progress is session-only until you sign in (requires MongoDB).
- Audio falls back to the browser’s `speechSynthesis`.
- Tutor hints use the built-in pedagogical fallback.
- Pay button records a pending order only if MongoDB is set; STK needs Daraja keys.

## Environment variables

See `.env.example`.

## Deploy on Render

1. Push this repo to GitHub.
2. Create a **Web Service** on Render, connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all env vars from `.env.example` in the Render dashboard.
6. Set `MPESA_CALLBACK_URL` to `https://<your-service>.onrender.com/api/payments/callback`.
7. Use an HTTPS URL so Daraja can reach the callback.

## Admin access

Sign in with an email listed in `ADMIN_EMAILS`, then open `/admin`.

## Project layout

```
app/
  page.tsx              # Main learner UI
  admin/page.tsx        # Admin dashboard
  components/           # ARViewer, AuthModal, PayModal
  api/
    auth/               # register, login, me
    progress/           # save / load attempts
    tutor/              # Gemma or fallback hints
    tts/                # ElevenLabs
    payments/stk        # STK Push
    payments/callback   # Daraja result
    admin/              # stats
lib/
  lessons.ts            # Lesson content
  db.ts                 # Mongo helpers
  auth.ts               # JWT + bcrypt
  mpesa.ts              # Daraja STK
```

## Adding real GLB models

Place `.glb` files in `public/models/` and set `modelSrc` on lessons in `lib/lessons.ts`.
Until then, the AR viewer will show a broken-image state; the rest of the lesson still works.
Sample models: https://modelviewer.dev/examples/

## M-Pesa notes

- Sandbox credentials come from the Daraja portal: https://developer.safaricom.co.ke/
- The immediate STK response is **not** proof of payment; only the **callback** with `ResultCode === 0` grants access and counts revenue.
- Never put consumer secret / passkey in client code.
