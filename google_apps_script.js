/**
 * URUGC — Google Apps Script Form Handler
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new).
 * 2. Rename the spreadsheet to "URUGC Submissions".
 * 3. In the menu, click: Extensions -> Apps Script.
 * 4. Replace any existing code in the editor with this entire file.
 * 5. Click "Deploy" -> "New deployment".
 * 6. Under "Select type" (gear icon), select "Web app".
 * 7. Set:
 *    - Description: "URUGC Form Submission Web App"
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone"
 * 8. Click "Deploy" and authorize access when prompted.
 * 9. Copy the "Web app URL" (it looks like: https://script.google.com/macros/s/.../exec).
 * 10. Paste this URL into assets/js/form-config.js or your .env file as GOOGLE_SCRIPT_URL.
 */

// Target email for all submission notifications
const RECIPIENT_EMAIL = "urugccompany@gmail.com";

// Standard 9-column header list
const HEADERS = [
  "Submission Date & Time",
  "Submission Type",
  "Name",
  "Brand / Company",
  "Email",
  "Social / Profile Link",
  "Category",
  "Portfolio Link",
  "Campaign Details"
];

function doPost(e) {
  try {
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    const type = data.submission_type || (data.brand ? "Brand" : "Creator");
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone() || "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

    // Open active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Submissions");
    if (!sheet) {
      sheet = ss.insertSheet("Submissions");
    }

    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length)
        .setBackground("#121211")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Prepare row data
    const name = data.name || "";
    const brand = data.brand_company || data.brand || "—";
    const email = data.email || "";
    const social = data.social_profile_link || data.c_handle || "—";
    const category = data.category || data.c_niche || "—";
    const portfolio = data.portfolio_link || data.c_portfolio || "—";
    const details = data.campaign_details || data.message || "—";

    const row = [
      formattedDate,
      type,
      name,
      brand,
      email,
      social,
      category,
      portfolio,
      details
    ];

    sheet.appendRow(row);

    // Prepare email notification
    sendNotificationEmail(type, name, brand, email, social, category, portfolio, details, formattedDate);

    // Return success JSON
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Submission successfully recorded."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(type, name, brand, email, social, category, portfolio, details, date) {
  const isBrand = type.toLowerCase() === "brand";
  const subject = isBrand 
    ? `NEW BRAND CAMPAIGN ENQUIRY: ${brand} (${name})`
    : `NEW CREATOR APPLICATION: ${name} (${category})`;

  const textBody = `
========================================
URUGC — ${subject}
========================================
Date & Time: ${date}
Submission Type: ${type}

Name: ${name}
Email: ${email}
${isBrand ? `Brand / Company: ${brand}\n\nCampaign Details:\n${details}` : `Social Profile / Handle: ${social}\nPrimary Category: ${category}\nPortfolio / Reel: ${portfolio}`}
========================================
Recorded in Google Sheet: "URUGC Submissions"
`.trim();

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5DFD4; border-radius: 8px; background-color: #FBF9F5;">
  <div style="background-color: #121211; padding: 15px 20px; border-radius: 6px; margin-bottom: 20px;">
    <h2 style="color: #BFA785; margin: 0; font-size: 18px; letter-spacing: 1px;">URUGC NOTIFICATION</h2>
    <p style="color: #FFFFFF; margin: 5px 0 0 0; font-size: 14px;">${subject}</p>
  </div>
  
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63; width: 35%;">Submission Type:</td>
      <td style="padding: 10px 0; color: #121211; font-weight: bold;">${type}</td>
    </tr>
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Date & Time:</td>
      <td style="padding: 10px 0; color: #121211;">${date}</td>
    </tr>
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Full Name:</td>
      <td style="padding: 10px 0; color: #121211; font-weight: bold;">${name}</td>
    </tr>
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Email Address:</td>
      <td style="padding: 10px 0; color: #121211;"><a href="mailto:${email}" style="color: #BFA785;">${email}</a></td>
    </tr>
    ${isBrand ? `
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Brand / Company:</td>
      <td style="padding: 10px 0; color: #121211;">${brand}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #786E63; vertical-align: top;">Campaign Details:</td>
      <td style="padding: 10px 0; color: #121211; line-height: 1.5; white-space: pre-wrap;">${details}</td>
    </tr>
    ` : `
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Social Handle / Link:</td>
      <td style="padding: 10px 0; color: #121211;">${social}</td>
    </tr>
    <tr style="border-bottom: 1px solid #E5DFD4;">
      <td style="padding: 10px 0; color: #786E63;">Primary Category:</td>
      <td style="padding: 10px 0; color: #121211;">${category}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #786E63;">Portfolio / Reel Link:</td>
      <td style="padding: 10px 0; color: #121211;"><a href="${portfolio}" target="_blank" style="color: #BFA785;">${portfolio}</a></td>
    </tr>
    `}
  </table>
  
  <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #E5DFD4; font-size: 12px; color: #8C8275; text-align: center;">
    This submission was recorded automatically in your Google Sheet and sent to ${RECIPIENT_EMAIL}.
  </div>
</div>
`.trim();

  MailApp.sendEmail({
    to: RECIPIENT_EMAIL,
    replyTo: email,
    subject: subject,
    body: textBody,
    htmlBody: htmlBody
  });
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "URUGC Form Submission Service is running."
  })).setMimeType(ContentService.MimeType.JSON);
}
