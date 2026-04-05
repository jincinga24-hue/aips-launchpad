# AIPS Launchpad v2

## Project
Multi-user web app for AIPS club at University of Melbourne. Supabase backend with Google/email auth and Resend email notifications.

## Tech
- Frontend: vanilla JS ES modules, HTML, CSS
- Backend: Supabase (Postgres, Auth, Edge Functions, RLS)
- Email: Resend via Supabase Edge Function
- No build step — ES modules loaded via script type="module"

## UI Style
- Clean Apple white/grey aesthetic
- Colors: white (#fff), light grey (#f5f5f7), border grey (#d2d2d7), text (#1d1d1f, #86868b)
- AIPS green (#2DB757) for accents only
- Rajdhani font for headings, system font for body

## Key Files
- index.html — HTML shell
- css/style.css — all styles
- js/ — modular JS (app, auth, supabase, submit, board, admin, player-card, my-submissions, utils)
- config.js — Supabase credentials (gitignored)
- supabase/migrations/001_schema.sql — database schema
- supabase/functions/notify/index.ts — email notifications
