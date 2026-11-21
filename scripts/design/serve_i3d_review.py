"""Loopback-only, uncached I3d design review. No backend or persistence."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store, max-age=0')
        super().end_headers()
if __name__ == '__main__':
    root=Path(__file__).resolve().parents[2]/'design/i3d-trainer-schedule'
    print('I3d design preview: http://127.0.0.1:3213/ (local simulation only)',flush=True)
    ThreadingHTTPServer(('127.0.0.1',3213),partial(PreviewHandler,directory=str(root))).serve_forever()
