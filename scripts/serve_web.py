"""Local-only preview. Only docs/ is served; private music has one explicit route."""
import argparse
import functools
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FORMATS = [".mp3", ".m4a", ".wav", ".aiff", ".aac"]

def soundtrack():
    files = [p for p in (ROOT / "music").glob("*") if p.is_file() and "commando" in p.name.lower() and p.suffix.lower() in FORMATS]
    return min(files, key=lambda p: (FORMATS.index(p.suffix.lower()), p.name)) if files else None

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript"}

    def do_GET(self):
        route = urlsplit(self.path).path
        track = soundtrack()
        if route == "/local-music.json":
            data = json.dumps({"url": "./local-soundtrack", "name": track.name} if track else {}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        elif route == "/local-soundtrack" and track:
            # Safari uses byte ranges when probing and seeking audio.
            size = track.stat().st_size
            start, end = 0, size - 1
            byte_range = self.headers.get("Range")
            if byte_range:
                try:
                    unit, bounds = byte_range.split("=", 1)
                    first, last = bounds.split("-", 1)
                    if unit != "bytes" or "," in bounds:
                        raise ValueError()
                    if first:
                        start, end = int(first), min(int(last) if last else size - 1, size - 1)
                    else:
                        start = max(0, size - int(last))
                    if start < 0 or start > end or start >= size:
                        raise ValueError()
                except ValueError:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.end_headers()
                    return
            self.send_response(206 if byte_range else 200)
            self.send_header("Content-Type", self.guess_type(str(track)))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(end - start + 1))
            if byte_range:
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.end_headers()
            try:
                with track.open("rb") as stream:
                    stream.seek(start)
                    remaining = end - start + 1
                    while remaining:
                        block = stream.read(min(65536, remaining))
                        if not block:
                            break
                        self.wfile.write(block)
                        remaining -= len(block)
            except (BrokenPipeError, ConnectionResetError):
                pass
        else:
            super().do_GET()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    print(f"Iron Signal: http://localhost:{args.port} — Ctrl+C stops the server", flush=True)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), functools.partial(Handler, directory=str(ROOT / "docs")))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
