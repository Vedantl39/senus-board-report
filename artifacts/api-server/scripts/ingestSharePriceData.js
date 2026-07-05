/**
 * Deterministic (non-AI) ingestion of the two share-price spreadsheets into
 * the live `disclosures`/`source_documents` tables.
 *
 * These files are already-structured spreadsheet data (a daily price
 * history and a rolling-window performance summary), so — same principle
 * already used for derived metrics — this reads the relevant cells
 * directly with the `xlsx` library rather than sending them through an AI
 * extraction call. There is nothing for Claude to interpret here: the
 * numbers are already labeled and typed.
 *
 * Inserts one `share_price_close` metric (the most recent close in the
 * historical price file), with `comparative_value` set to the admission
 * price already in the DB (from the Information Document PDF extraction)
 * so the KPI card's trend arrow reflects performance since IPO — which
 * matches the YTD % independently reported in the performance file
 * (sanity-checked below, not just assumed).
 *
 * This is additive-only (never touches/overwrites existing rows) and each
 * source file gets its own `source_documents` row for traceability, so it
 * doesn't need the full extract->staging->diff->swap process reserved for
 * AI extraction runs — there's no fabrication risk to validate against,
 * just a straight, idempotent read of two cells.
 *
 * Usage: node scripts/ingestSharePriceData.js
 */

const path = require("path");
const xlsx = require("xlsx");
const { pool } = require("../src/lib/db");
const { categoryForMetric } = require("../src/extraction/taxonomy");

const ASSETS_DIR = path.join(__dirname, "../../../attached_assets");

const HISTORICAL_PRICE_FILE = "SENUS_Historical_price_1783253990764.xlsx";
const PERFORMANCE_FILE = "IE000O0F49R3-XACD_Performance_1783253990765.xlsx";

function readSheetRows(filename) {
  const fullPath = path.join(ASSETS_DIR, filename);
  const workbook = xlsx.readFile(fullPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { header: 1 });
}

/**
 * Parses "DD/MM/YYYY" (the format used in the historical price sheet) into
 * a comparable ISO string, so rows can be sorted without assuming the
 * sheet is already in date order.
 */
function parseDdMmYyyy(dateStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Reads `SENUS_Historical_price.xlsx` and returns the most recent day's
 * close price and its date. Sheet shape (row 0 is a title, row 1 is
 * headers): Date | Open | High | Low | Close | Vol.
 */
function getLatestClosePrice() {
  const rows = readSheetRows(HISTORICAL_PRICE_FILE);
  const dataRows = rows.slice(2).filter((row) => row.length > 0 && row[0]);

  let latest = null;
  for (const row of dataRows) {
    const [dateStr, , , , close] = row;
    if (typeof close !== "number") continue;
    const date = parseDdMmYyyy(dateStr);
    if (!latest || date > latest.date) {
      latest = { date, dateStr, close };
    }
  }

  if (!latest) {
    throw new Error(`No usable close-price rows found in ${HISTORICAL_PRICE_FILE}`);
  }
  return latest;
}

/**
 * Reads `IE000O0F49R3-XACD_Performance.xlsx` and returns the YTD % change,
 * used only as an independent sanity check against the admission-price
 * comparison computed below (they should roughly agree).
 */
function getYtdPercent() {
  const rows = readSheetRows(PERFORMANCE_FILE);
  const header = rows[1];
  const pctRow = rows.find((row) => row[0] === "%");
  if (!header || !pctRow) {
    throw new Error(`Could not find header/"%" rows in ${PERFORMANCE_FILE}`);
  }
  const ytdIndex = header.indexOf("YTD");
  if (ytdIndex === -1) {
    throw new Error(`Could not find a "YTD" column in ${PERFORMANCE_FILE}`);
  }
  return pctRow[ytdIndex];
}

async function getAdmissionPrice(client) {
  const { rows } = await client.query(
    `SELECT payload->>'value' AS value
     FROM disclosures
     WHERE record_type = 'metric' AND payload->>'metric_name' = 'admission_price'
     ORDER BY extracted_at DESC
     LIMIT 1`,
  );
  if (rows.length === 0) {
    throw new Error(
      "No admission_price disclosure found — run the PDF extraction pipeline first.",
    );
  }
  return Number(rows[0].value);
}

async function alreadyIngested(client, filename) {
  const { rows } = await client.query(
    `SELECT id FROM source_documents WHERE filename = $1 LIMIT 1`,
    [filename],
  );
  return rows.length > 0;
}

async function insertSourceDocument(client, { filename, periodCovered }) {
  const { rows } = await client.query(
    `INSERT INTO source_documents (filename, doc_type, period_covered, audited, in_scope, uploaded_at)
     VALUES ($1, 'market_data', $2, false, true, now())
     RETURNING id`,
    [filename, periodCovered],
  );
  return rows[0].id;
}

async function main() {
  const latestClose = getLatestClosePrice();
  const ytdPercent = getYtdPercent();
  const admissionPrice = await getAdmissionPrice(pool);

  const impliedYtdPercent = ((latestClose.close - admissionPrice) / admissionPrice) * 100;
  const ytdDelta = Math.abs(impliedYtdPercent - ytdPercent);
  if (ytdDelta > 1) {
    // Not fatal — the performance file's YTD window may not align exactly
    // with "since admission" — but a large discrepancy would indicate a
    // parsing bug worth investigating rather than silently trusting.
    console.warn(
      `WARNING: computed change-vs-admission-price (${impliedYtdPercent.toFixed(2)}%) ` +
        `differs from the sheet's own YTD % (${ytdPercent}%) by more than 1pp. ` +
        `Double-check parsing before trusting this ingestion.`,
    );
  } else {
    console.log(
      `Sanity check OK: computed change-vs-admission (${impliedYtdPercent.toFixed(2)}%) ` +
        `matches sheet YTD % (${ytdPercent}%) within 1pp.`,
    );
  }

  if (await alreadyIngested(pool, HISTORICAL_PRICE_FILE)) {
    console.log("Already ingested — skipping (idempotent, no changes made).");
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const historicalPriceDocId = await insertSourceDocument(client, {
      filename: HISTORICAL_PRICE_FILE,
      periodCovered: `as at ${latestClose.dateStr}`,
    });
    await insertSourceDocument(client, {
      filename: PERFORMANCE_FILE,
      periodCovered: `as at ${latestClose.dateStr}`,
    });

    await client.query(
      `INSERT INTO disclosures
        (source_document_id, record_type, category, period_label, payload)
       VALUES ($1, 'metric', $2, $3, $4)`,
      [
        historicalPriceDocId,
        categoryForMetric("share_price_close"),
        `as at ${latestClose.dateStr}`,
        JSON.stringify({
          metric_name: "share_price_close",
          value: latestClose.close,
          unit: "EUR",
          comparative_value: admissionPrice,
          comparative_period: "IPO admission price",
          derived: false,
        }),
      ],
    );

    await client.query("COMMIT");
    console.log(
      `Inserted share_price_close = ${latestClose.close} EUR (as at ${latestClose.dateStr}), ` +
        `compared against admission price ${admissionPrice} EUR.`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
