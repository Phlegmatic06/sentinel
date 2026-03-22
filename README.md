<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TensorFlow.js-4.22-orange?style=flat-square&logo=tensorflow" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/MediaPipe-FaceMesh-4285F4?style=flat-square&logo=google" />
</p>

# 🛡️ Sentinel

**Browser-based AI exam proctoring.** No downloads, no extensions — just a webcam and a browser.

Sentinel watches candidates in real-time using on-device ML models (TensorFlow.js + MediaPipe FaceMesh) to detect cheating behaviors like phone usage, looking away, leaving the frame, or having someone else in the room. Everything runs client-side — no video streams are sent to any server.

> Built for educators and institutions that need a lightweight, self-hosted proctoring solution without the overhead of commercial platforms.

---

## What it does

🎥 **Real-time face tracking** — MediaPipe FaceMesh runs at ~30fps to track head pose, gaze direction, and presence. If the candidate looks away for too long or leaves the frame, it gets flagged.

📱 **Object detection** — COCO-SSD (MobileNet v2) scans the webcam feed for phones, laptops, and books. Detected items are instantly logged with a snapshot.

🔒 **Fullscreen lockdown** — Exams run in mandatory fullscreen. Exiting fullscreen, switching tabs, or losing window focus triggers violation logging. Repeated offenses auto-submit the exam.

🧠 **AI exam generator** — Paste lecture notes or any text, and Groq's Llama 3 API generates MCQ questions from it in seconds. You can also build exams manually or upload them as JSON.

📊 **Admin dashboard** — Create exams, view submissions with scores, manage questions, and review the full violation audit trail with evidence snapshots.

👤 **Multi-admin auth** — Each admin only sees their own exams and logs. Row Level Security on Supabase enforces this at the database level.

⏱️ **Timed exams** — Set a duration limit and the exam auto-submits when time runs out. Candidates see a live countdown.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| AI/ML | TensorFlow.js, COCO-SSD, MediaPipe FaceMesh |
| LLM | Groq API (Llama 3 8B) |
| Backend | Supabase — Postgres, Auth, Realtime, Storage |
| Deployment | Vercel |

---

## Getting started

```bash
git clone https://github.com/Phlegmatic06/sentinel.git
cd sentinel
npm install
```

Create a `.env.local` in the project root:

```env
GROQ_API_KEY="your_groq_api_key"
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

Then run:

```bash
npm run dev
```

Head to `http://localhost:3000` and you're live.

> **Need to set up Supabase?** Follow [`supabase_setup_guide.md`](./supabase_setup_guide.md) for the full database schema, storage bucket config, and RLS policies.

---

## How exams work

1. Admin creates an exam (manually, via JSON upload, or with AI generation)
2. Admin copies the exam link and shares it with candidates
3. Candidate opens the link, enters their name, grants camera access
4. Exam launches in fullscreen with the Sentinel engine running alongside
5. Any violations (phone detected, face missing, gaze deviation, tab switch, etc.) are logged with timestamps and snapshots
6. Candidate submits → score is calculated and stored
7. Admin views results and violation history from the dashboard

---

## Anti-cheat behavior

| Event | Action |
|-------|--------|
| Phone / laptop / book detected | Logged + snapshot captured |
| Face not in frame (>1.5s) | Logged as "Presence Lost" |
| Multiple faces detected | Logged as "Identity Breach" |
| Sustained gaze deviation (>3s) | Logged as "Gaze Deviation" |
| Tab switch (`visibilitychange`) | **Auto-submits exam** |
| Exit fullscreen | **Auto-submits exam** |
| Window blur (×2) | **Auto-submits exam on 2nd offense** |
| Copy/paste/right-click | Blocked during exam |
| Keyboard shortcuts (Ctrl+C/V/P, F-keys) | Blocked during exam |

---

## Deployment

Push to GitHub → import into [Vercel](https://vercel.com/new) → add env vars → deploy. That's it.

Don't forget to update your **Supabase Site URL** (under Authentication → URL Configuration) to your Vercel domain so email confirmation links work correctly.

---

## Project structure

```
src/
├── app/
│   ├── api/generate-exam/     # Groq LLM endpoint for AI exam generation
│   ├── auth/                  # Login, signup, password reset, callback
│   ├── dashboard/             # Evidence vault + admin console
│   │   └── admin/
│   │       ├── builder/       # Manual + AI exam builder
│   │       └── exam/[id]/     # Per-exam submissions view
│   └── exam/[id]/             # Candidate exam-taking page
├── components/
│   ├── SentinelEngine.tsx     # Core AI proctoring engine
│   └── ProtectedRoute.tsx     # Auth gate for dashboard
└── lib/
    ├── supabase.ts            # Supabase client + violation logging
    └── examService.ts         # CRUD for exams and submissions
```

---

## License

Do whatever you want with it. No license file, no restrictions.

---

<p align="center">
  <sub>made by <a href="https://github.com/Phlegmatic06">Arghyadeep</a></sub>
</p>
