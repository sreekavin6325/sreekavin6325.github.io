/**
 * Contact form → Google Sheet
 *
 * Paste this into your sheet's Apps Script editor (Extensions → Apps Script) and deploy
 * it as a web app. Full steps are in README.md ("Contact form → Google Sheets").
 *
 * The portfolio's /api/contact route posts each message here. This script:
 *   - checks the shared secret (so only your site can add rows),
 *   - allows at most LIMIT messages per email address in WINDOW_HOURS,
 *   - appends a row: Time | Name | Email | Phone | Topic | Message.
 */

// Must match CONTACT_SHEET_SECRET in the site's .env.local. Use a long random string.
const SECRET = "change-me-to-a-long-random-string";

const SHEET_NAME = "Messages";
const LIMIT = 2;
const WINDOW_HOURS = 24;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // one message at a time, so the limit can't be raced

    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) return json({ ok: false, error: "unauthorized" });

    const sheet = getSheet();
    const email = String(data.email || "").trim().toLowerCase();
    const since = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;

    const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
    const recent = rows.filter(function (row) {
      return String(row[2]).toLowerCase() === email && new Date(row[0]).getTime() >= since;
    }).length;
    if (recent >= LIMIT) return json({ ok: false, error: "rate_limited" });

    sheet.appendRow([
      new Date(),
      safe(data.name),
      safe(email),
      safe(data.phone),
      safe(data.topic),
      safe(data.message),
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "server_error" });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["Time", "Name", "Email", "Phone", "Topic", "Message"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Stops text like "=HYPERLINK(...)" from being run as a spreadsheet formula. */
function safe(value) {
  const text = String(value == null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
