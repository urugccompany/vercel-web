# URUGC — UGC That Connects

[![Website](https://img.shields.io/badge/Website-URUGC.in-BFA785?style=flat-square)](https://urugc.in)
[![Instagram](https://img.shields.io/badge/Instagram-@urugccompany-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/urugccompany)
[![Contact](https://img.shields.io/badge/Contact-urugccompany@gmail.com-blue?style=flat-square)](mailto:urugccompany@gmail.com)

A modern, high-end editorial website and creator marketing platform for **URUGC**. Crafted with an editorial aesthetic that exudes authenticity, luxury, and cultural resonance.

---

## 🌟 Brand Identity & Architecture

- **Brand Name**: **URUGC**
- **Tagline**: *"UGC That Connects"*
- **Official Domain**: **URUGC.in**
- **Official Instagram**: **[@urugccompany](https://instagram.com/urugccompany)**
- **Contact Email**: **urugccompany@gmail.com**
- **Form Submissions Target**: **urugccompany@gmail.com**
- **Legal Entity**: **URUGC Company**

### Design & Typography System
- **Palette**:
  - **Background**: Warm Ivory (`#FBF9F5` / `#F6F3EC`)
  - **Typography**: Deep Charcoal (`#121211`)
  - **Accents**: Muted Taupe (`#8C8275`) and Warm Champagne Gold (`#BFA785`)
- **Typography**:
  - **Primary Display**: *Outfit* (contemporary, confident, subtle rounded curves)
  - **Secondary Headings & UI**: *Plus Jakarta Sans* (clean, structured, highly readable)
  - **Body Text**: *Plus Jakarta Sans* (refined geometric sans for paragraphs & forms)
- **Visual Language**: Refined rounded geometry (10px–14px radius on cards, buttons, badges, and modals), bespoke glassmorphism, and responsive layout without layout shifts.

---

## 📁 Repository Structure

```
urugc-website/
├── index.html                    # Complete luxury editorial website
├── server.py                     # Local HTTP server & /api/submit endpoint
├── start_preview.py              # One-click preview launcher with auto-browser opening
├── google_apps_script.js         # Production Google Sheets & Gmail notification script
├── README.md                     # Documentation and deployment guide
├── .gitignore                    # Git exclusions
├── assets/
│   ├── css/
│   │   └── style.css             # Unified styling, typography & mobile responsiveness
│   ├── js/
│   │   ├── main.js               # Navigation, validation, UI animations & form handler
│   │   └── form-config.js        # Config for local API & Google Sheets Web App URL
│   └── images/
│       └── urugc-logo.jpg        # Official URUGC brand logo
└── data/
    ├── submissions.csv           # 9-column live submissions spreadsheet
    └── submissions.json          # Persistent JSON store for form records
```

---

## 🚀 Quick Start (Running Locally)

You can run the built-in Python server which serves the website and provides the live form submission API endpoint:

```bash
# 1. Clone or open the project folder
cd urugc-website

# 2. Start the server (serves site + handles form submissions on port 8080)
python3 server.py
# or
python3 start_preview.py
```

- Open **[http://localhost:8080](http://localhost:8080)** in your browser.
- Submissions will automatically be recorded in `data/submissions.csv` and `data/submissions.json`.

---

## 📝 Form Submission System

Both forms (**Brand Campaign Enquiry** and **Creator Network Application**) feature client-side validation, anti-spam validation, disabled loading states with spinners, inline feedback, and persistent recording.

### Database Schema (9 Columns)
1. `Submission Date & Time` (e.g., `2026-09-11 20:36:15`)
2. `Submission Type` (`Brand` / `Creator`)
3. `Name`
4. `Brand / Company`
5. `Email`
6. `Social / Profile Link`
7. `Category`
8. `Portfolio Link`
9. `Campaign Details`

### Syncing with Google Sheets & Email (`google_apps_script.js`)
To have submissions automatically append to your Google Sheet and send instant email notifications to `urugccompany@gmail.com`:

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. In the menu bar, go to **Extensions** $\rightarrow$ **Apps Script**.
3. Delete any code in the editor, and paste the code from [`google_apps_script.js`](google_apps_script.js).
4. Click **Deploy** $\rightarrow$ **New deployment**.
5. Select type: **Web app**:
   - **Description**: `URUGC Form Webhook`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
6. Click **Deploy** and authorize the script permissions when prompted.
7. Copy the **Web App URL** (ends in `/exec`).
8. Open `assets/js/form-config.js` and paste your URL:
   ```javascript
   GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
   ```
Now submissions from the web will go straight into your Google Sheet and notify your Gmail inbox in real-time!

---

## 🌐 Deploying to GitHub & GitHub Pages

### 1. Push to GitHub

Create a new repository on [GitHub](https://github.com/new), then run:

```bash
cd urugc-website

# Add your remote repository URL
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git

# Push to the main branch
git branch -M main
git push -u origin main
```

### 2. Host on GitHub Pages (Free Static Hosting)
1. Go to your repository **Settings** on GitHub.
2. Select **Pages** in the left sidebar.
3. Under **Build and deployment**, choose **Branch: main** and folder **/ (root)**.
4. Click **Save**. Within a minute, your website will be live at `https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>/`.
*(Ensure you have linked your Google Apps Script URL in `form-config.js` so form submissions work on static hosting).*

---

## 📄 License & Credits
Designed and developed for **URUGC**. All rights reserved © 2026 URUGC Company.
# vercel-web
# vercel-web
