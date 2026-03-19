# Sentinel AI 🛡️

Sentinel AI is a next-generation auto-proctoring exam platform. It leverages advanced on-device computer vision models running via WebGL to ensure academic integrity in fully remote environments.

## Core Features
- **Real-Time Proctoring**: Utilizes TensorFlow.js, MediaPipe FaceMesh, and the COCO-SSD object detection models.
- **Identity & Presence Checks**: Detects if the candidate leaves the frame, if multiple people are present, or if there is severe gaze deviation.
- **Prohibited Items Detection**: Automatically detects cell phones, laptops, and books in the webcam feed.
- **Evidence Vault**: Securely captures snapshots of violations and logs them to a Supabase backend.
- **AI-Powered Exam Generation**: Dynamically creates MCQ tests from source text using the fast Groq Llama 3 API.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS & Lucide React
- **AI/ML**: `@tensorflow/tfjs`, `@tensorflow-models/coco-ssd`, `@mediapipe/face_mesh`, `groq-sdk`
- **Backend & DB**: Supabase (PostgreSQL, Realtime, Storage)

## Setup and Installation

### 1. Clone & Install
```bash
git clone https://github.com/your-username/sentinel.git
cd sentinel
npm install
```

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` (or create it) and populate the following keys:
```env
# Groq API for AI Exam Generation
GROQ_API_KEY="your_groq_api_key_here"

# Supabase (See Supabase Setup Guide)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
```

### 3. Run Locally
```bash
npm run dev
```

## Deployment Options

### Deploying to Vercel (Recommended)
Sentinel AI is optimized for Vercel.

1. Create a GitHub repository and push your local code:
```bash
git remote add origin https://github.com/your-username/sentinel.git
git branch -M main
git push -u origin main
```
2. Go to [Vercel](https://vercel.com/new).
3. Import your `sentinel` GitHub repository.
4. Add the **Environment Variables** (`GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings before deploying.
5. Click **Deploy**.

## Supabase Schema
See `supabase_setup_guide.md` for full instructions on setting up the database tables (`sentinel_exams`, `sentinel_submissions`, `sentinel_logs`) and the `sentinel-evidence` storage bucket.

---
*Built to ensure trust and integrity in digital assessments.*
