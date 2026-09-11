/**
 * URUGC — Form Submission Configuration
 * 
 * To connect to Google Sheets & Gmail directly from the browser:
 * 1. Deploy the code in `google_apps_script.js` as a Web App in Google Apps Script.
 * 2. Paste the resulting Web App URL into GOOGLE_SCRIPT_URL below.
 * 
 * When GOOGLE_SCRIPT_URL is set, the website sends form submissions directly to
 * your Google Sheet & Gmail. When empty, it uses the local/server endpoint (/api/submit).
 */
window.URUGC_CONFIG = {
  // Production Google Apps Script Web App URL (leave empty to use local backend)
  GOOGLE_SCRIPT_URL: "",

  // Fallback / Local server submission endpoint
  LOCAL_API_ENDPOINT: "/api/submit",

  // Receiving notification email address
  RECIPIENT_EMAIL: "urugcgcompany@gmail.com"
};
