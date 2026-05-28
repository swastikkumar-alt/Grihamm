# Grihamm Web App

Grihamm is an app-first property-services marketplace and execution OS for residential, corporate, retail, and commercial projects.

## Main Flows

- `/` is the primary app experience: booking, verified partners, tracker, escrow wallet, audit, and partner workspace.
- `/marketplace` redirects to `/`.
- `/contractor-register` is the professional onboarding application.
- `/dashboard` redirects signed-in users to the correct dashboard.
- `/contractor-os` is the professional site-progress dashboard for contractors and designers.
- `/track-project` is the customer project tracking dashboard.
- `/admin` is the operations console.

## Supabase

Business records use Supabase directly from the Vite app through `src/lib/api.ts`. Authentication uses Supabase Auth with Google OAuth.

Apply migrations in order:

```text
supabase/migrations/20260516000000_grihamm_supabase.sql
supabase/migrations/20260527000000_secure_app_first_mvp.sql
supabase/migrations/20260528000000_schedule_and_resource_contractors.sql
supabase/migrations/20260528010000_backfill_approved_applications.sql
supabase/migrations/20260528020000_admin_emails_and_wallet.sql
supabase/migrations/20260528030000_progress_update_files.sql
```

The later migrations add project schedule fields, seed the contractor reference sheet into `professionals`, backfill approved applications into the public partner directory, move admin authorization to `admin_emails`, add a persisted wallet ledger with RPC-backed audit and funding actions, and link progress proof files to contractor updates.

Create `webapp/.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPER_ADMIN_EMAILS=admin@example.com,ops@example.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
```

Admin access is controlled in two places: `VITE_SUPER_ADMIN_EMAILS` enables the admin UI for those signed-in emails, and `public.admin_emails` authorizes admin database policies. Keep the values in sync before deployment.

Wallet funding is stored in `wallet_transactions` and increments `projects.escrow_amount` through `public.record_wallet_funding`. `VITE_RAZORPAY_KEY_ID` enables Razorpay Standard Checkout in test mode from the customer wallet screen. Do not put the Razorpay key secret in the Vite app; keep server-side order creation and signature verification in a backend or Supabase Edge Function before live settlement.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run serve:dist
```
