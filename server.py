#!/usr/bin/env python3
"""
URUGC Company — Local Server & Form Submission API
Handles static file serving, CORS, field validation, persistent CSV/JSON storage,
and forwarding to Google Sheets and Email.
"""
import http.server
import socketserver
import json
import os
import sys
import re
import csv
from datetime import datetime
import urllib.request
import urllib.error

PORT = int(os.environ.get("PORT", 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "submissions.csv")
JSON_PATH = os.path.join(DATA_DIR, "submissions.json")

# Environment variables with defaults
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "urugcgcompany@gmail.com")
GOOGLE_SHEET_WEBHOOK_URL = os.environ.get("GOOGLE_SHEET_WEBHOOK_URL", "")

HEADERS = [
    "Submission Date & Time",
    "Submission Type",
    "Name",
    "Brand / Company",
    "Email",
    "Social / Profile Link",
    "Category",
    "Portfolio Link",
    "Campaign Details"
]

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
URL_REGEX = re.compile(r"^(https?://|www\.)[^\s]+$")

def init_storage():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(CSV_PATH):
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(HEADERS)
    if not os.path.exists(JSON_PATH):
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump([], f)

def record_submission(entry):
    init_storage()
    # 1. Append to CSV
    row = [
        entry["submission_date_time"],
        entry["submission_type"],
        entry["name"],
        entry["brand_company"],
        entry["email"],
        entry["social_profile_link"],
        entry["category"],
        entry["portfolio_link"],
        entry["campaign_details"]
    ]
    with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(row)

    # 2. Append to JSON
    submissions = []
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            submissions = json.load(f)
    except Exception:
        submissions = []
    submissions.append(entry)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(submissions, f, indent=2)

    # 3. Forward to Email (FormSubmit / urugcgcompany@gmail.com)
    forward_to_email(entry)

    # 4. Optional: forward to Google Sheet Webhook if configured
    if GOOGLE_SHEET_WEBHOOK_URL:
        try:
            req = urllib.request.Request(
                GOOGLE_SHEET_WEBHOOK_URL,
                data=json.dumps(entry).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception as e:
            print(f"[Warning] Failed to forward to Google Sheets webhook: {e}")

def forward_to_email(entry):
    try:
        sub_type = entry.get("submission_type", "General")
        name = entry.get("name", "")
        brand = entry.get("brand_company", "")
        email = entry.get("email", "")
        
        subject = f"[URUGC Brand Enquiry] {brand} — {name}" if sub_type == "Brand" else f"[URUGC Creator Application] {name}"
        payload = {
            "_subject": subject,
            "_replyto": email,
            "_template": "table",
            "_captcha": "false",
            "Submission Date & Time": entry.get("submission_date_time", ""),
            "Submission Type": sub_type,
            "Full Name": name,
            "Brand / Company": brand,
            "Email Address": email,
            "Social Handle / Profile Link": entry.get("social_profile_link", "—"),
            "Primary Category": entry.get("category", "—"),
            "Portfolio / Video Reel Link": entry.get("portfolio_link", "—"),
            "Campaign Details": entry.get("campaign_details", "—")
        }
        req = urllib.request.Request(
            f"https://formsubmit.co/ajax/{RECIPIENT_EMAIL}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"[Warning] Failed to forward email via FormSubmit: {e}")

class URUGCHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local and web testing
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/submit" or self.path == "/api/submit/":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            
            try:
                payload = json.loads(body)
            except Exception:
                # Try parsing urlencoded
                import urllib.parse
                parsed = urllib.parse.parse_qs(body)
                payload = {k: v[0] if len(v) == 1 else v for k, v in parsed.items()}

            sub_type = payload.get("submission_type")
            if not sub_type:
                sub_type = "Brand" if "brand" in payload else "Creator"

            name = payload.get("name") or payload.get("c_name", "").strip()
            email = payload.get("email") or payload.get("c_email", "").strip()

            # Server-side validation
            errors = []
            if not name:
                errors.append("Name is required.")
            if not email or not EMAIL_REGEX.match(email):
                errors.append("A valid email address is required.")

            if sub_type == "Brand":
                brand = payload.get("brand", "").strip()
                message = payload.get("message", "").strip()
                if not brand:
                    errors.append("Brand / company name is required.")
                if not message:
                    errors.append("Campaign details are required.")
                social = "—"
                category = "—"
                portfolio = "—"
                details = message
            else:
                brand = "—"
                social = payload.get("c_handle", "").strip()
                category = payload.get("c_niche", "").strip()
                portfolio = payload.get("c_portfolio", "").strip() or "—"
                details = "—"
                if not social:
                    errors.append("Social handle / profile link is required.")
                if not category:
                    errors.append("Primary category is required.")
                if portfolio != "—" and not URL_REGEX.match(portfolio):
                    errors.append("Portfolio link must be a valid URL (starting with http:// or https://).")

            if errors:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                response = {
                    "status": "error",
                    "errors": errors,
                    "message": "Validation failed: " + " ".join(errors)
                }
                self.wfile.write(json.dumps(response).encode("utf-8"))
                return

            # Prepare database record
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            entry = {
                "submission_date_time": now_str,
                "submission_type": sub_type,
                "name": name,
                "brand_company": brand,
                "email": email,
                "social_profile_link": social,
                "category": category,
                "portfolio_link": portfolio,
                "campaign_details": details
            }

            try:
                record_submission(entry)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                msg = (
                    "Thank you. Your campaign enquiry has been received. We'll get back to you shortly."
                    if sub_type == "Brand"
                    else "Thank you. Your creator profile has been submitted and will be reviewed for relevant opportunities."
                )
                response = {
                    "status": "success",
                    "message": msg,
                    "recipient": RECIPIENT_EMAIL,
                    "data": entry
                }
                self.wfile.write(json.dumps(response).encode("utf-8"))
                print(f"[URUGC Server] Successfully recorded {sub_type} submission from {name} ({email}) at {now_str}")
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                response = {
                    "status": "error",
                    "message": f"Server failed to save submission: {e}. Please contact {RECIPIENT_EMAIL} directly."
                }
                self.wfile.write(json.dumps(response).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    init_storage()
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), URUGCHandler) as httpd:
        print("=" * 65)
        print(f"  URUGC Company — Form Backend & Static Server")
        print(f"  Serving at: http://localhost:{PORT}")
        print(f"  API Endpoint: http://localhost:{PORT}/api/submit")
        print(f"  Notifications directed to: {RECIPIENT_EMAIL}")
        print(f"  Submissions saved to: {CSV_PATH}")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()
