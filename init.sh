#!/bin/bash
set -e
echo "Setting up AIPS Launchpad..."
lsof -ti:8080 2>/dev/null | xargs kill 2>/dev/null || true
sleep 0.5
cd /Users/jincinga24/Documents/Playground
python3 -c "
from http.server import HTTPServer, SimpleHTTPRequestHandler
class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
HTTPServer(('', 8080), H).serve_forever()
" &>/dev/null &
sleep 1
echo "Server ready at http://localhost:8080/aips-launchpad/index.html"
