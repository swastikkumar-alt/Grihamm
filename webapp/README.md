# Grihamm Web App

Grihamm is a property-services marketplace and execution OS for residential, corporate, retail, and commercial projects.

## Main Flows

- `/` is the customer homepage.
- `/marketplace` is the booking and professional discovery workflow.
- `/contractor-register` is the professional onboarding application.
- `/dashboard` redirects signed-in users to the correct dashboard.
- `/contractor-os` is the professional site-progress dashboard for contractors and designers.
- `/track-project` is the customer project tracking dashboard.
- `/admin` is the operations console.

## Supabase Database

Business records now use Supabase directly from the Vite app through `src/lib/api.ts`. The Supabase schema stores user profiles, professional listings, GSTIN/profile verification details, portfolio image URLs, onboarding applications, projects, progress updates, customer remarks, and Grihamm audit requests. Site audit requests are priced at `Rs 999`.

Run this SQL in your Supabase project SQL editor before starting the app:

```text
supabase/migrations/20260516000000_grihamm_supabase.sql
```

Then create `webapp/.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The migration currently allows browser-key reads and writes because Firebase Auth tokens are not automatically understood by Supabase Row Level Security. For production role enforcement, add a Firebase-token-verifying backend or a Supabase custom JWT bridge before tightening the policies.

## Firebase Auth

Authentication stays on Firebase so Google sign-in continues to work. Add these values to `webapp/.env.local` when Google login should be enabled:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run serve:dist
```
