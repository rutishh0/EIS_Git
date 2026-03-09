import * as XLSX from "xlsx";

export interface ParsedAirline {
  name: string;
  eisLead: string | null;
  engineType: string;
  region: string;
  eisDate: string | null;
  eisDateTbc: boolean;
  eisRisk: string;
  lastUpdated: string | null;
  serviceLines: ParsedServiceLine[];
}

export interface ParsedServiceLine {
  name: string;
  ragStatus: string;
  statusText: string | null;
  comments: string | null;
}

/**
 * Service line column definitions for the Power BI flat export.
 * Each group is [ragColIndex, statusColIndex, commentsColIndex, canonicalName].
 */
const SERVICE_LINE_COLS: [number, number, number, string][] = [
  [8, 9, 10, "Product Agreement"],
  [11, 12, 13, "TotalCare Agreement"],
  [14, 15, 16, "IP Spares"],
  [17, 18, 19, "PAS"],
  [20, 21, 22, "LRU Management"],
  [23, 24, 25, "LRP Management"],
  [26, 27, 28, "Spare Engine - Dedicated"],
  [29, 30, 31, "NDSES"],
  [32, 33, 34, "Transportation - Routine"],
  [35, 36, 37, "Transportation - Remote"],
  [38, 39, 40, "EHM"],
  [41, 42, 43, "DACs/ Lifing Insight"],
  [44, 45, 46, "IP Tooling"],
  [47, 48, 49, "On-Wing Tech Support"],
  [50, 51, 52, "Overhaul Services"],
  [53, 54, 55, "Engine Split"],
  [56, 57, 58, "Customer Training"],
  [59, 60, 61, "Flight Ops"],
  [62, 63, 64, "Field Support"],
  [65, 66, 67, "Airline Facility Readiness"],
  [68, 69, 70, "Bespoke Service"],
  [71, 72, 73, "Bespoke Service 2"],
];

/**
 * Map RAG color words from the Power BI export to our enum values.
 * The Excel uses: BLUE, GREEN, Orange, RED, GREY
 * Some cells may contain status text instead of color (e.g. "C - PA is signed")
 */
const RAG_COLOR_MAP: Record<string, string> = {
  BLUE: "C",
  GREEN: "G",
  ORANGE: "A",
  RED: "R",
  GREY: "NA",
  GRAY: "NA",
};

function parseRagColor(value: unknown): string {
  if (!value) return "NA";
  const str = String(value).trim().toUpperCase();

  // Direct color match
  if (RAG_COLOR_MAP[str]) return RAG_COLOR_MAP[str];

  // Sometimes the RAG column contains status text like "C - PA is signed"
  // Extract the prefix letter
  const prefixMatch = str.match(/^(C|G|A|R)\s*[-–]/);
  if (prefixMatch) return prefixMatch[1];

  // Check if it starts with N/A
  if (str.startsWith("N/A") || str === "NA") return "NA";

  // Check for color word anywhere
  for (const [color, rag] of Object.entries(RAG_COLOR_MAP)) {
    if (str.includes(color)) return rag;
  }

  return "G"; // Default
}

/**
 * Map EIS risk strings from the Power BI export to our enum values.
 */
function parseRisk(value: unknown): string {
  if (!value) return "NO_RISK";
  const str = String(value).trim().toLowerCase();
  if (str.includes("no risk")) return "NO_RISK";
  if (str.includes("customer")) return "YES_CUSTOMER";
  if (str.includes("rolls-royce") || str.includes("rr")) return "YES_RR";
  return "NO_RISK";
}

/**
 * Map region strings from the Power BI export to our enum values.
 */
function parseRegion(value: unknown): string {
  if (!value) return "EUROPE";
  const str = String(value).trim().toLowerCase();
  if (str.includes("greater china")) return "GREATER_CHINA";
  if (str.includes("china")) return "GREATER_CHINA";
  if (str === "mea" || str.includes("middle east")) return "MEA";
  if (str === "apac" || str.includes("asia")) return "APAC";
  if (str.includes("america")) return "AMERICAS";
  if (str.includes("europe")) return "EUROPE";
  return "EUROPE";
}

/**
 * Parse a date value from the Excel export.
 * Handles: Date objects, ISO strings, "TBC", serial numbers.
 */
function parseDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (str.toUpperCase() === "TBC" || str === "") return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }

  // Try parsing as date string
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed).toISOString().split("T")[0];

  return null;
}

/**
 * Find the header row by looking for "Customer" in the row.
 */
function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (!row) continue;
    for (let j = 0; j < row.length; j++) {
      const val = String(row[j] || "").trim();
      if (val === "Customer") return i;
    }
  }
  return 3; // Default for Power BI export
}

/**
 * Dynamically detect service line column groups from the header row.
 * Looks for columns ending with "RAG" and treats the next 2 columns as status + comments.
 */
function detectServiceLineCols(headerRow: unknown[]): [number, number, number, string][] {
  const cols: [number, number, number, string][] = [];
  for (let i = 0; i < headerRow.length; i++) {
    const val = String(headerRow[i] || "").trim();
    if (val.endsWith("RAG") || val.endsWith("RAG 2")) {
      // The status column name is the canonical service line name
      const statusName = String(headerRow[i + 1] || "").trim();
      if (statusName) {
        cols.push([i, i + 1, i + 2, statusName]);
      }
    }
  }
  return cols;
}

/**
 * Parse the Power BI flat-table Excel export.
 * Format: Single sheet, one row per airline, 74 columns.
 * Row 3 = headers, rows 4+ = data.
 */
export function parseExcelWorkbook(buffer: ArrayBuffer): ParsedAirline[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const airlines: ParsedAirline[] = [];

  // Try each sheet - the Power BI export is typically the first/only sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });
    if (rows.length < 3) continue;

    const headerRowIdx = findHeaderRow(rows);
    const headerRow = rows[headerRowIdx];
    if (!headerRow) continue;

    // Find the Customer column index
    let customerCol = -1;
    let eisLeadCol = -1;
    let engineTypeCol = -1;
    let regionCol = -1;
    let eisDateCol = -1;
    let eisRiskCol = -1;
    let lastUpdatedCol = -1;

    for (let c = 0; c < headerRow.length; c++) {
      const h = String(headerRow[c] || "").trim().toLowerCase();
      if (h === "customer") customerCol = c;
      else if (h === "eis lead") eisLeadCol = c;
      else if (h === "engine type") engineTypeCol = c;
      else if (h === "region") regionCol = c;
      else if (h === "eis date") eisDateCol = c;
      else if (h.includes("slippage") || h.includes("risk")) eisRiskCol = c;
      else if (h.includes("last updated") || h.includes("scorecard last")) lastUpdatedCol = c;
    }

    if (customerCol === -1) continue; // Not a valid data sheet

    // Detect service line columns dynamically from headers
    let slCols = detectServiceLineCols(headerRow);
    // Fallback to hardcoded columns if detection fails
    if (slCols.length === 0) slCols = SERVICE_LINE_COLS;

    // Track customer names for deduplication
    const nameCount: Record<string, number> = {};

    // Parse each data row
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;

      const customer = String(row[customerCol] || "").trim();
      if (!customer) continue;

      const engineType = engineTypeCol >= 0
        ? String(row[engineTypeCol] || "").trim()
        : "Unknown";

      // Handle duplicate customer names by appending engine type
      nameCount[customer] = (nameCount[customer] || 0) + 1;
      let uniqueName = customer;
      if (nameCount[customer] > 1) {
        uniqueName = `${customer} (${engineType})`;
      }

      const eisDateRaw = eisDateCol >= 0 ? row[eisDateCol] : null;
      const eisDateStr = String(eisDateRaw || "").trim();
      const isTbc = eisDateStr.toUpperCase() === "TBC" || eisDateStr === "";

      const airline: ParsedAirline = {
        name: uniqueName,
        eisLead: eisLeadCol >= 0
          ? String(row[eisLeadCol] || "").trim() || null
          : null,
        engineType,
        region: parseRegion(regionCol >= 0 ? row[regionCol] : null),
        eisDate: isTbc ? null : parseDate(eisDateRaw),
        eisDateTbc: isTbc,
        eisRisk: parseRisk(eisRiskCol >= 0 ? row[eisRiskCol] : null),
        lastUpdated: lastUpdatedCol >= 0 ? parseDate(row[lastUpdatedCol]) : null,
        serviceLines: [],
      };

      // Parse service lines
      for (const [ragCol, statusCol, commentsCol, slName] of slCols) {
        const ragValue = row[ragCol];
        const statusText = String(row[statusCol] || "").trim() || null;
        const comments = String(row[commentsCol] || "").trim() || null;

        airline.serviceLines.push({
          name: slName,
          ragStatus: parseRagColor(ragValue),
          statusText,
          comments,
        });
      }

      airlines.push(airline);
    }

    // If we found airlines, we're done (don't parse other sheets)
    if (airlines.length > 0) break;
  }

  // Fix duplicate names: go back and rename first occurrence if there were duplicates
  const firstOccurrence: Record<string, number> = {};
  const duplicates = new Set<string>();
  for (let i = 0; i < airlines.length; i++) {
    const baseName = airlines[i].name.replace(/\s*\(.*\)$/, "");
    if (firstOccurrence[baseName] !== undefined) {
      duplicates.add(baseName);
    } else {
      firstOccurrence[baseName] = i;
    }
  }
  // Rename first occurrences of duplicated names
  for (const name of duplicates) {
    const idx = firstOccurrence[name];
    if (idx !== undefined && airlines[idx].name === name) {
      airlines[idx].name = `${name} (${airlines[idx].engineType})`;
    }
  }

  return airlines;
}
