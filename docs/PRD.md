# AIPS Launchpad v2.1 — Dashboard & Home Redesign PRD

## Overview
Redesign the AIPS Launchpad home page and dashboard inspired by shitjournal.org's editorial layout. Add activity feeds, featured project spotlight, announcement banners, metrics with personality, and a professional dark footer.

## MVP Features

### Feature 1: Home Page Redesign
- Announcement banner at top (dismissible, accent colored)
- Featured Project spotlight (hero card for best/newest approved project)
- Metrics with personality (not just plain numbers — labels, icons, subtle animations)
- "How it works" section polished with better cards
- Dark footer with AIPS portal links (Instagram, Discord, email, guidelines)

### Feature 2: Dashboard Redesign (My Submissions → Dashboard)
- Two-column layout: your projects (left), activity feed (right)
- Activity feed shows: who joined your team (player cards), status changes, timestamps
- Project cards in dashboard show status badge, score, applicant count
- Quick actions: view on board, edit (if revision), see applicants

### Feature 3: Polish & Bug Fixes
- Fix "Join This Team" button (already fixed in code, verify working)
- Fix filter pill visibility (All/All Roles buttons white on white)
- Visual effects working (confetti, card flip, spotlight hover)
- Responsive layout check
- AIPS Member badge placeholder (visual only, no gating)

## Tech Stack
- Existing: vanilla JS ES modules, Supabase, HTML/CSS
- No new dependencies

## UI Direction
- Inspired by shitjournal.org: editorial layout, two-column sections, dark footer
- Keep Apple white/grey base aesthetic
- AIPS green (#2DB757) for accents
- Add warmth: featured project hero with subtle gradient or image

## Success Metric
Home page looks professional and engaging. Dashboard shows real-time activity. All existing features still work.

## Kill Metric
Core features (submit, board, admin, player cards) break during redesign.
