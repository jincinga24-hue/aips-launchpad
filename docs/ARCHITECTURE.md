# AIPS Launchpad — Architecture

## Structure
```
aips-launchpad/
  index.html          # Single-page app (HTML + CSS + JS)
  docs/
    PRD.md
    ARCHITECTURE.md
  HARNESS-STATE.md
  FEATURES.json
```

## Single File Architecture
Everything lives in `index.html`:
- `<style>` block: all CSS
- `<body>`: HTML structure with tab-based navigation
- `<script>` block: all JS logic

## Page Tabs
1. Home — hero + stats + CTA
2. Submit — project submission form
3. Board — approved projects grid + filters
4. My Submissions — status check by email
5. Admin — hidden, accessed via #admin=aips2026

## Data Model (localStorage)
Key: `aips_projects` — JSON array of project objects
Each project has: id, track, name, problem, solution, targetUser, mvpScope, rolesNeeded, contactEmail, demoLink, videoLink, status (pending/approved/revision), scores, totalScore, feedback, submittedAt, playerCards[]

## Rendering
- Tab switching via JS show/hide
- Cards rendered dynamically from localStorage data
- Radar chart for player cards via SVG or Canvas
- Filters applied client-side

## Admin Access
- URL hash check: `window.location.hash === '#admin=aips2026'`
- Shows/hides admin tab accordingly
