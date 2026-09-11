#!/usr/bin/env python3
"""
Simple local preview server for URUGC Company website.
Run this script to launch a local server and view the website in your browser:
    python3 start_preview.py
"""
import http.server
import socketserver
import webbrowser
import os
import sys

from server import URUGCHandler, init_storage, PORT, BASE_DIR

def main():
    init_storage()
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), URUGCHandler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print("=" * 60)
        print("  URUGC Company — Luxury Editorial Website Preview & Form API")
        print(f"  Serving at: {url}")
        print("  API Endpoint: /api/submit")
        print("  Submissions recorded in: data/submissions.csv")
        print("  Press Ctrl+C to stop the preview server.")
        print("=" * 60)
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nPreview server stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
