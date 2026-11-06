/**
 * Receives area suggestions from the web app and appends them to the sheet.
 *
 * Bound to the submissions Google Sheet (Extensions → Apps Script) and deployed
 * as a web app that runs as the sheet's owner and is open to anyone. The sheet
 * is the only thing it can write to. See README.md in this folder.
 *
 * The browser sends a text/plain POST (a "simple" request, so no CORS preflight)
 * whose body is JSON:
 *
 *   { county_code, locality, area, display_name?, consent, website }
 *
 * `website` is a honeypot: real visitors never see or fill it. Rules here match
 * scripts/submissions/lib.js, which is the authority; this script only keeps
 * obvious junk out of the sheet.
 */

var SHEET_NAME = "Submissions";
var HEADERS = ["id", "submitted_at", "type", "county_code", "locality", "area", "display_name", "status"];
var DAILY_LIMIT = 200; // all visitors together: Apps Script cannot see IP addresses
var MAX_NAME_LENGTH = 60;
var MAX_DISPLAY_NAME_LENGTH = 40;
var PLACE_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '’.,\-\/&()]*$/u;
var HAS_LETTER = /\p{L}/u;

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Honeypot: say yes, store nothing.
    if (data.website) return reply({ ok: true });

    if (data.consent !== true) return reply({ ok: false, error: "consent_required" });

    var county = String(data.county_code || "").trim();
    if (/^\d{1,3}$/.test(county)) county = ("000" + county).slice(-3);
    if (!/^0(0[1-9]|[1-3]\d|4[0-7])$/.test(county)) return reply({ ok: false, error: "invalid_county" });

    var locality = tidy(data.locality);
    var area = tidy(data.area);
    if (!goodName(locality) || !goodName(area)) return reply({ ok: false, error: "invalid_name" });

    var displayName = cleanDisplayName(data.display_name);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (!underDailyLimit()) return reply({ ok: false, error: "too_many_today" });
      append([
        Utilities.getUuid(),
        new Date().toISOString(),
        "area",
        county,
        locality,
        area,
        displayName,
        "",
      ]);
    } finally {
      lock.releaseLock();
    }
    return reply({ ok: true });
  } catch (error) {
    return reply({ ok: false, error: "bad_request" });
  }
}

/** Opening the URL in a browser shows that the endpoint is alive. */
function doGet() {
  return reply({ ok: true, service: "kenya-locations submissions" });
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

function tidy(value) {
  return String(value == null ? "" : value)
    .normalize("NFC")
    .replace(/[\p{Cc}\p{Cf}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function goodName(value) {
  return (
    value.length >= 2 &&
    value.length <= MAX_NAME_LENGTH &&
    PLACE_NAME.test(value) &&
    HAS_LETTER.test(value) &&
    !/https?:|www\./i.test(value)
  );
}

/** One line, no "@", commas, links or markup. The importer cleans it again. */
function cleanDisplayName(value) {
  var text = tidy(value)
    .replace(/https?:\/\/\S*|www\.\S*/gi, " ")
    .replace(/[<>\[\]()*_`#|\\~@,:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > MAX_DISPLAY_NAME_LENGTH ? text.slice(0, MAX_DISPLAY_NAME_LENGTH - 1).trim() + "…" : text;
}

/** Counts submissions per day across all visitors; returns false once the limit is reached. */
function underDailyLimit() {
  var props = PropertiesService.getScriptProperties();
  var key = "count:" + Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd");
  var count = Number(props.getProperty(key) || 0);
  if (count >= DAILY_LIMIT) return false;
  props.setProperty(key, String(count + 1));
  return true;
}

function append(values) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Missing sheet tab: " + SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var row = sheet.getLastRow() + 1;
  var range = sheet.getRange(row, 1, 1, values.length);
  // Plain text: keeps "047" from becoming 47, and nothing a visitor typed is read as a formula.
  range.setNumberFormat("@").setValues([values.map(asText)]);
}

/** A value that starts like a formula gets a leading apostrophe, which Sheets treats as "this is text". */
function asText(value) {
  var text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
