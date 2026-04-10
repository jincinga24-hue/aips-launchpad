# AIPS Launchpad — Progress

## Status: LIVE
- **Production URL:** https://aips-launchpad.vercel.app
- **Custom domain:** https://aips.build (pending DNS propagation)
- **GitHub:** https://github.com/jincinga24-hue/aips-launchpad

## What's Working
- Intro splash animation (green chevron + AIPS reveal)
- Home page: announcement banner (links to UMSU signup), hero with animated gradient, featured project, stats with SVG icons, vertical timeline "How it works", funding section, dark footer
- Google OAuth + email/password login
- Project submission (Idea/MVP toggle, categories, all fields)
- Admin scoring (5 criteria sliders, approve/reject, endorse toggle)
- Project board with search, stage/role/category filters, progress bars, urgency, applicant count, endorsed badges
- Project detail modal with score breakdown
- Player card creator with radar chart + multi-role selection
- Dashboard: two-column layout, project cards with quick actions, activity feed
- Contact method flow (shown after player card submit)
- Responsive (mobile + desktop)
- Bless.network-inspired design (serif headlines, pill nav, airy layout, dark footer)

## Architecture
- Frontend: vanilla JS ES modules, HTML, CSS (no build step)
- Backend: Supabase (Postgres, Auth, RLS, Edge Functions)
- Email: Resend via Edge Function (deployed, trigger needs webhook setup)
- Hosting: Vercel (auto-deploys from GitHub main branch)
- Domain: aips.build (Vercel)

## Known Issues
- Email notification trigger disabled (needs Supabase webhook, not pg_net)
- Safari has issues with ES modules from esm.sh
- Existing projects missing `category` column data (new submissions will have it)

## Admin Access
- Login with Google (jincinga24@gmail.com has admin role)
- To add admins: Supabase SQL Editor → `UPDATE profiles SET role = 'admin' WHERE email = '...';`

## To Deploy Changes
Just push to GitHub — Vercel auto-deploys:
```bash
cd ~/Documents/Playground/aips-launchpad
git add -A && git commit -m "your message" && git push
```
