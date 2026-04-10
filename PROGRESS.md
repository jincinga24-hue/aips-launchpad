# AIPS Launchpad — Progress

## Status: LIVE
- **Production:** https://aips-launchpad.vercel.app
- **Custom domain:** https://aips.build (Vercel)
- **GitHub:** https://github.com/jincinga24-hue/aips-launchpad
- **Supabase:** twhiraqvmqxxwhogijat

## Features

### Home Page
- Intro splash animation (AIPS chevron + letter reveal, split screen)
- Announcement banner (links to UMSU signup, dismissible)
- Hero with DM Serif Display headlines, animated gradient background
- Two-path cards: "Launch an Idea" (blue) vs "Grow Your MVP" (green)
- Featured Project spotlight (highest-scored approved project)
- Stats with SVG icons and count-up animation
- Vertical timeline "How it Works" (3 steps)
- Funding Coming Soon section
- Dark rounded footer (AIPS links, Instagram, email, guidelines)

### Project Submission
- Idea vs MVP tracks with different form labels and hints
- Category selector (FinTech, EdTech, Health, AI/ML, etc.)
- Role selection (Build, Design, Research, Grow, Advise)
- MVP-only: demo link, video link, current team
- Contact method (free text — Instagram, iMessage, etc.)

### Admin Panel
- Separate scoring rubrics: Idea (concept criteria) vs MVP (execution criteria)
- Both scored /100 (5 criteria x 20 each)
- Approve/reject with written feedback
- Endorse projects (AIPS Endorsed badge)
- Manage approved projects tab

### Project Board
- Search bar (real-time filtering)
- Filters: stage, role, category
- Team completeness progress bar
- Applicant count, urgency indicator
- Idea (blue) vs MVP (green) visual distinction
- AIPS Endorsed badge
- Category tags on cards

### Player Cards & Profiles
- Personal player card (My Card page) — build once, use everywhere
- Avatar upload (drag & drop, Supabase Storage)
- Skill tags (type + Enter or click Add)
- Availability status (Looking / Open / Busy)
- Year level badge
- Social links (GitHub, LinkedIn, Instagram, Portfolio)
- Project showcase (up to 3 past projects)
- 5-axis radar chart (Coding, Design, Research, Communication, Domain)
- Card theme colors (green, blue, purple, orange, red)
- One-click join: "Join with Your Card" (confetti + card flip animation)
- Leave team: "Leave Team" button to withdraw

### Endorsements
- Teammates can endorse each other on projects
- Shows on trading cards: thumbs-up icon + "ENDORSEMENTS" header + quotes
- Shows on My Card page under "Endorsements Received"
- Shows in Dashboard activity feed

### Dashboard
- Two-column layout (projects + activity feed)
- Project cards with status, score, applicant count, quick actions
- Activity feed: applications, approvals, revisions, endorsements
- Contact buttons on applicant cards (Email, IG, LinkedIn)

### Auth
- Google OAuth only (clean single-button login)
- Role-based admin access
- Auth guard on protected pages

## Tech Stack
- Frontend: vanilla JS ES modules, HTML, CSS (no build step)
- Backend: Supabase (Postgres, Auth, Edge Functions, RLS, Storage)
- Email: Resend via Edge Function (deployed, trigger needs webhook)
- Hosting: Vercel (auto-deploys from GitHub)
- Domain: aips.build

## To Deploy Changes
```bash
cd ~/Documents/Playground/aips-launchpad
git add -A && git commit -m "message" && git push
```
Vercel auto-deploys on push.

## Admin Access
- Login with Google (jincinga24@gmail.com = admin)
- Add admins: `UPDATE profiles SET role = 'admin' WHERE email = '...';`

## Supabase Config
- Site URL: https://aips-launchpad.vercel.app (or https://aips.build)
- Redirect URLs: https://aips-launchpad.vercel.app/**, https://aips.build/**
- Google OAuth: configured in Google Cloud Console (project: AIPS)
- Storage bucket: avatars (public)
