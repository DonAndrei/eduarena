# EduArena — indoor football pitch booking

Next.js 15 + Prisma/Postgres. Bilingual (RO default, EN). Customers pick day → start time (30-min grid) → duration (1h, 1.5h, 2h…) → confirm by email. Owner admin at `/admin`.

## Run locally
```bash
npm install
npm run db:dev          # local Postgres (no Docker needed)
npx prisma migrate dev  # create tables
npm run dev             # http://localhost:3000
```
`.env` is preconfigured for local dev. Emails are printed to the server console (no `RESEND_API_KEY`). Admin password: `ADMIN_PASSWORD` in `.env`.

## Anti-spam (no online payment yet)
- Booking is `PENDING` until the customer clicks the email link; unconfirmed ones expire after `pendingHoldMinutes` (30) and free the slot.
- Cloudflare Turnstile captcha + hidden honeypot field.
- Max active bookings per email/phone (default 2), max 8 attempts/hour per IP.
- Postgres exclusion constraint `Booking_no_overlap` makes double-booking impossible.
- Owner can cancel anything from admin. Stripe deposit can later be added as a step before `CONFIRMED`.

## Admin (`/admin`)
Day view + timeline, upcoming 14 days, cancel/confirm, add phone bookings, block intervals, settings (hours per weekday, price/hour, max duration, booking window, hold time, per-person limit).

## Content to replace
- `src/content/venue.ts` — phone, address, email, social links, gallery list
- `public/gallery/` — real photos (placeholders are SVGs)
- `messages/ro.json`, `messages/en.json` — all site texts

## Deploy (Vercel + Neon/Supabase)
1. Create Postgres DB, set env vars from `.env.example` in Vercel.
2. `npm run db:migrate` against prod DB (or add to build).
3. Resend: verify domain, set `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`.
4. Turnstile: create site, set real keys (dev uses Cloudflare test keys).

## Checks
```bash
npm test                         # slot logic unit tests
npx tsx scripts/check-overlap.ts # DB rejects overlapping bookings
```
