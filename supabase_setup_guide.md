# Supabase Setup Guide for Sentinel AI

This guide explains how to set up the backend database and storage for the Sentinel AI Exam Proctoring System using Supabase.

## Prerequisites
* A free [Supabase](https://supabase.com/) account.
* A GitHub account (for easy Supabase login).

## Step 1: Create a New Supabase Project
1. Go to [database.new](https://database.new/) or log into the Supabase dashboard and click **New Project**.
2. Select an organization (or create one), enter a project name (e.g., "Sentinel Data"), and generate a secure database password.
3. Select your preferred region and click **Create new project**. Note: It will take a few minutes for the database to provision.

## Step 2: Get Your API Keys
1. Once your project is ready, click on the **Settings** (gear icon) in the left sidebar.
2. Navigate to **API** under the Configuration section.
3. Copy the **Project URL** and the **anon `public` API Key**.
4. Create a `.env.local` file in the root of your Next.js project (`/home/kaido/.gemini/antigravity/scratch/sentinel`) and paste the credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 3: Create the Storage Bucket for Snapshot Evidence
1. In the Supabase left sidebar, click on **Storage** (folder icon).
2. Click **New Bucket**.
3. Name the bucket exactly: `sentinel-evidence`.
4. **Important**: Toggle the "Public Bucket" switch to ON so that dashboard images can be viewed freely.
5. Click **Save**.

## Step 4: Create the Audit Logs Database Table
1. In the Supabase left sidebar, click on **SQL Editor** (code brackets icon).
2. Click **New Query**.
3. Paste the following SQL code exactly as written, then click **Run**:

```sql
create table public.sentinel_logs (
  id uuid not null default gen_random_uuid (),
  violation_type text not null,
  image_url text null,
  created_at timestamp with time zone not null default now(),
  constraint sentinel_logs_pkey primary key (id)
);

-- Enable realtime changes so the dashboard updates automatically
alter publication supabase_realtime add table public.sentinel_logs;

-- Disable Row Level Security (RLS) for testing purposes
-- Note: In a real production environment, you should properly configure JWT RLS here
alter table public.sentinel_logs disable row level security;
```

## Step 5: Test the Integration
1. Restart your Next.js development server if it is running (`npm run dev`).
2. Visit `http://localhost:3000` and start a secure session.
3. Trigger a violation (e.g., hold up a phone or look away).
4. Navigate to `/dashboard` to see the real violation logged with a clickable Evidence Snapshot that loads from your Supabase bucket!
