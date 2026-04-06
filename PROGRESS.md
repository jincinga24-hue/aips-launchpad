# AIPS Launchpad — Progress

## Current Status: v2 Beta (partially working)

### What Works
- Home page with hero, stats (live from Supabase), funding section
- Google OAuth login/signup
- Email/password login/signup
- Nav with Launch / Projects / Dashboard tabs
- Auth guard (redirects to login for protected tabs)
- Admin role-based access (not URL hash)
- Project submission form (Idea/MVP toggle, all fields, validation)
- Admin scoring panel (5 criteria sliders, approve/reject)
- Project board with filters (stage + role)
- Project detail modal (full info, score breakdown, demo/video links)
- Player card creation form with radar chart
- My Submissions / Dashboard (shows your projects + applicant cards with emails)
- Contact method flow (shown after player card submit)
- Supabase RLS policies for data security
- Resend Edge Function deployed (email notifications)

### Known Bugs (to fix next session)
1. **"Join This Team" button may not respond** — click listener wired via `data-open-pc` attribute + event delegation in board.js. Need to test in Chrome DevTools console to see the actual error.
2. **Email notification trigger dropped** — was causing "invalid input syntax for type json" error. Trigger removed. Need to re-add using database webhook approach instead of pg_net.
3. **Safari doesn't work** — ES modules from esm.sh don't load in Safari. Chrome only for now.
4. **Browser caching issues** — no-cache server helps but Chrome aggressively caches JS modules. Users need hard refresh (Cmd+Shift+R) or incognito window after code changes.
5. **Visual effects (confetti, card flip, spotlight)** — restored in js/effects.js but untested end-to-end.
6. **"How it works" step cards** — may not be visible (scroll reveal animation).
7. **Filter pill buttons** — "All" and "All Roles" barely visible when active (white on white).

### Architecture
```
aips-launchpad/
  index.html              — HTML shell
  config.js               — Supabase credentials (gitignored)
  css/style.css           — all styles
  js/
    app.js                — router, nav, init, auth UI
    auth.js               — Supabase auth (Google + email/password)
    supabase.js           — client singleton
    submit.js             — project submission form
    board.js              — project board, filters, detail modal
    admin.js              — admin scoring panel
    player-card.js        — card creator, radar chart, trading cards
    my-submissions.js     — dashboard for project owners
    utils.js              — escapeHtml, constants, radar SVG
    effects.js            — confetti, card flip, spotlight, scroll reveal
  supabase/
    migrations/001_schema.sql  — DB schema, RLS, triggers
    functions/notify/index.ts  — Resend email Edge Function
```

### Supabase Setup (already done)
- Project: twhiraqvmqxxwhogijat
- Schema deployed (profiles, projects, player_cards tables)
- RLS policies enabled
- Google OAuth configured
- pg_net extension enabled
- Edge Function `notify` deployed
- Resend API key set as secret
- Admin role set for jincinga24@gmail.com
- Notification trigger DROPPED (needs webhook approach)

### What's Left for v2 Complete
1. Fix "Join This Team" button click
2. Re-enable email notifications via Supabase webhook (not pg_net trigger)
3. Fix Safari compatibility (or accept Chrome-only for now)
4. Test full flow end-to-end: submit → admin score → approve → board → join → player card
5. Visual polish: filter pills, scroll animations, responsive check
6. Deploy to a real URL (Vercel/Netlify) — update Site URL in Supabase

### How to Run
```bash
# Start no-cache server from ~/Documents/Playground
python3 -c "
from http.server import HTTPServer, SimpleHTTPRequestHandler
class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
HTTPServer(('', 8080), H).serve_forever()
"

# Open in Chrome (not Safari)
open -a "Google Chrome" http://localhost:8080/aips-launchpad/index.html
```

### Admin Access
- Login with Google (jincinga24@gmail.com)
- Admin tab appears automatically (role-based)
- To make others admin: `UPDATE profiles SET role = 'admin' WHERE email = 'their@email.com';`

### Key Decisions Made
- Manual admin review (not AI scoring) — for v2
- Google + email/password auth (both)
- Resend for email notifications (free tier, 100/day)
- Role-based admin (not URL hash)
- Public board browsing (no login required)
- Player card emails hidden from public, visible only to project owners
- Contact method field (free text — Instagram, iMessage, etc.) instead of forced URL
- Single HTML + JS modules (no build step)
- Supabase free tier
