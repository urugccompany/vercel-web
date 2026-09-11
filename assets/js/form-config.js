/**
 * URUGC — Form Submission Configuration
 * 
 * Multi-Channel Delivery System:
 * 1. DIRECT EMAIL: Submissions automatically deliver directly to urugcgcompany@gmail.com
 *    via FormSubmit without needing any backend server on Render.
 * 2. GOOGLE SHEETS: Deploy `google_apps_script.js` as a Web App and paste the URL into
 *    GOOGLE_SCRIPT_URL below to also maintain a live Google Sheet database.
 */
window.URUGC_CONFIG = {
  // Production Google Apps Script Web App URL (for Google Sheets database sync)
  GOOGLE_SCRIPT_URL: "",

  // Direct email delivery endpoint (active on live Render domain)
  EMAIL_SUBMISSION_ENDPOINT: "https://formsubmit.co/ajax/urugcgcompany@gmail.com",

  // Local Python API submission endpoint (used during local preview)
  LOCAL_API_ENDPOINT: "/api/submit",

  // Receiving notification email address
  RECIPIENT_EMAIL: "urugcgcompany@gmail.com"
};
