"""Serve only the local I3a design artifact, with fresh responses on reload."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[2] / 'design/i3a-program-dates-review'
    handler = partial(PreviewHandler, directory=str(root))
    print('I3a design preview: http://127.0.0.1:3207/ (local simulation only)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 3207), handler).serve_forever()
