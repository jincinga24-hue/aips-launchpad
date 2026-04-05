# AIPS Launchpad — PRD

## Overview
A single-page web app for AI Prototyping Studio (AIPS), a student club at the University of Melbourne. Students submit startup ideas or MVPs for committee review. Approved projects (score 60+/100) are published on a public board where others browse and join teams via personalized player cards.

## MVP Features

### Feature 1: Project Submission & Admin Review
- Students fill a structured form choosing Idea or MVP track
- Form fields: project name, track, problem statement, solution, target user, MVP scope, roles needed, contact email, demo link (MVP only), video link (MVP only)
- Submissions go to a Pending queue
- Admin view (accessed via URL hash `#admin=aips2026`) shows pending submissions
- Admin scores each submission on 5 criteria (0-20 each, total /100)
- Admin adds written feedback
- Score 60+ → published to board. Score <60 → returned with feedback for revision
- Students can check status via "My Submissions" tab (lookup by email)
- Students can revise and resubmit rejected submissions

### Feature 2: Project Board with Filters
- Public board displays approved projects as cards
- Card shows: name, one-line pitch, stage tag (Idea/MVP), score badge, roles needed, demo link
- Filters: by stage (All/Idea/MVP), by role needed (Build/Design/Research/Grow/Advise)
- Click card → expanded detail view with full info + video embed for MVPs
- Live stats on home: total projects, total contributors

### Feature 3: Player Cards & Team Joining
- Instead of a boring form, contributors create a player card (trading card style)
- Card fields: name, degree+year, role (pick 1 of 5), self-rated abilities (5-axis radar chart: Coding, Design, Research, Communication, Domain Knowledge), superpower tagline, contact email
- Radar/spider chart rendered with canvas or SVG
- Player cards stored per-project in localStorage
- Project founders can see who expressed interest

## 5 Contributor Roles
1. Build — developer, engineer
2. Design — UI/UX, branding, visual
3. Research — domain expertise, user research, data
4. Grow — marketing, outreach, launch strategy
5. Advise — mentorship, feedback, connections

## Scoring Rubric (5 x 20 = 100)
1. Problem Clarity — is the problem real and well-defined?
2. Solution Feasibility — can students build this in a semester?
3. Target User — who is this for specifically?
4. MVP Scope — is the first version small enough to ship?
5. Team Needs — clear about what help is needed and why?

## Tech Stack
- Single HTML file with embedded CSS and JS
- No framework, no build step, no backend
- localStorage for all data persistence
- Clean Apple white/grey UI with subtle AIPS green accents
- Rajdhani font for headings, system font for body
- Mobile-responsive

## Success Metric
A student can submit a project, an admin can score it, it appears on the board, and another student can create a player card to join — full loop working.

## Kill Metric
Core submission → review → publish flow is fundamentally broken after 10 cycles.

## UI Direction
- Clean, minimal Apple-inspired white/grey aesthetic
- Light backgrounds (#f5f5f7, #ffffff), subtle borders (#d2d2d7)
- SF-style system font stack for body text
- AIPS green (#2DB757) used sparingly for accents, CTAs, and score badges only
- Cards with subtle shadows, rounded corners
- Lots of whitespace
- No gradients on backgrounds — flat and clean
