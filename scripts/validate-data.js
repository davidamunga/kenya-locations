#!/usr/bin/env node

/**
 * Data Validation Script for Kenya Locations
 *
 * Reads JSON source files directly — no prior build required.
 * Run with: node scripts/validate-data.js
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJson(filename) {
  try {
    const fullPath = join(__dirname, "../data", filename);
    return JSON.parse(readFileSync(fullPath, "utf-8"));
  } catch (error) {
    log(`❌ Failed to read ${filename}: ${error.message}`, "red");
    process.exit(1);
  }
}

function loadData() {
  const counties = readJson("counties.json");
  const constituencies = readJson("constituencies.json");
  const wards = readJson("wards.json");
  const subCounties = readJson("sub-counties.json");
  const localities = readJson("locality.json");
  const areas = readJson("area.json");
  return { counties, constituencies, wards, subCounties, localities, areas };
}

function validateUniqueIds(data, type, idField = "code") {
  const ids = new Set();
  const duplicates = [];

  data.forEach((item, index) => {
    const id = item[idField];
    if (ids.has(id)) {
      duplicates.push({ id, index });
    } else {
      ids.add(id);
    }
  });

  if (duplicates.length > 0) {
    log(`❌ Duplicate ${idField}s found in ${type}:`, "red");
    duplicates.forEach(({ id, index }) => {
      log(`   - ${id} (at index ${index})`, "red");
    });
    return false;
  } else {
    log(`✅ All ${type} ${idField}s are unique`, "green");
    return true;
  }
}

function validateReferences(data, type, refField, refData, refType) {
  const refNames = new Set(refData.map((item) => item.name));
  const invalidRefs = [];

  data.forEach((item, index) => {
    const refValue = item[refField];
    if (!refNames.has(refValue)) {
      invalidRefs.push({ refValue, index, item: item.name || item.code });
    }
  });

  if (invalidRefs.length > 0) {
    log(`❌ Invalid ${refField} references found in ${type}:`, "red");
    invalidRefs.forEach(({ refValue, index, item }) => {
      log(
        `   - "${refValue}" in ${item} (index ${index}) - not found in ${refType}`,
        "red"
      );
    });
    return false;
  } else {
    log(`✅ All ${type} ${refField} references are valid`, "green");
    return true;
  }
}

function validateConstituencyReferences(constituencies, counties) {
  const invalidRefs = [];
  const countyNames = new Set(counties.map((c) => c.name));

  constituencies.forEach((constituency, index) => {
    const countyRef = constituency.county;
    if (!countyRef || typeof countyRef !== "string") {
      invalidRefs.push({
        constituency: constituency.name,
        index,
        issue: "Invalid county reference - should be a string",
      });
    } else if (!countyNames.has(countyRef)) {
      invalidRefs.push({
        constituency: constituency.name,
        index,
        issue: `County "${countyRef}" not found`,
      });
    }
  });

  if (invalidRefs.length > 0) {
    log("❌ Invalid county references found in constituencies:", "red");
    invalidRefs.forEach(({ constituency, index, issue }) => {
      log(`   - ${constituency} (index ${index}): ${issue}`, "red");
    });
    return false;
  } else {
    log("✅ All constituency county references are valid", "green");
    return true;
  }
}

function validateLocalityAreaReferences(areas, localities) {
  // Locality names repeat across counties, so match on county + name.
  const localityKeys = new Set(localities.map((l) => `${l.county}:${l.name}`));
  const invalidRefs = [];

  areas.forEach((area, index) => {
    if (!localityKeys.has(`${area.county}:${area.locality}`)) {
      invalidRefs.push({ area: area.name, locality: area.locality, index });
    }
  });

  if (invalidRefs.length > 0) {
    log("❌ Invalid locality references found in areas:", "red");
    invalidRefs.forEach(({ area, locality, index }) => {
      log(
        `   - Area "${area}" references locality "${locality}" (index ${index}) - not found in the same county`,
        "red"
      );
    });
    return false;
  } else {
    log("✅ All area locality references are valid", "green");
    return true;
  }
}

function validateLocalityUniqueness(localities) {
  const seen = {};
  const duplicates = [];

  localities.forEach((locality, index) => {
    const key = `${locality.county}:${locality.name}`;
    if (seen[key]) {
      duplicates.push({
        name: locality.name,
        county: locality.county,
        indices: [seen[key].index, index],
      });
    } else {
      seen[key] = { index, locality };
    }
  });

  if (duplicates.length > 0) {
    log("❌ Duplicate locality names found within the same county:", "red");
    duplicates.forEach(({ name, county, indices }) => {
      log(
        `   - "${name}" in ${county} (indices: ${indices.join(", ")})`,
        "red"
      );
    });
    return false;
  } else {
    log("✅ All locality names are unique within their counties", "green");
    return true;
  }
}

function validateAreaUniqueness(areas) {
  const seen = {};
  const duplicates = [];

  areas.forEach((area, index) => {
    const key = `${area.locality}:${area.name}`;
    if (seen[key]) {
      duplicates.push({
        name: area.name,
        locality: area.locality,
        indices: [seen[key].index, index],
      });
    } else {
      seen[key] = { index, area };
    }
  });

  if (duplicates.length > 0) {
    log("❌ Duplicate area names found within the same locality:", "red");
    duplicates.forEach(({ name, locality, indices }) => {
      log(
        `   - "${name}" in ${locality} (indices: ${indices.join(", ")})`,
        "red"
      );
    });
    return false;
  } else {
    log("✅ All area names are unique within their localities", "green");
    return true;
  }
}

function validateRequiredFields(data, type, fields) {
  const missing = [];

  data.forEach((item, index) => {
    fields.forEach((field) => {
      if (
        item[field] === undefined ||
        item[field] === null ||
        item[field] === ""
      ) {
        missing.push({ field, index, item: item.name || item.code || index });
      }
    });
  });

  if (missing.length > 0) {
    log(`❌ Missing required fields in ${type}:`, "red");
    missing.forEach(({ field, index, item }) => {
      log(`   - "${field}" missing on ${item} (index ${index})`, "red");
    });
    return false;
  } else {
    log(`✅ All ${type} have required fields`, "green");
    return true;
  }
}

// Folds case, spaces and punctuation so "Shimo La Tewa" matches "Shimo la Tewa".
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function validateNoNearDuplicates(data, type, scopeOf) {
  const seen = new Map();
  const duplicates = [];

  data.forEach((item, index) => {
    const key = `${scopeOf(item)}:${normalizeName(item.name)}`;
    if (seen.has(key)) {
      duplicates.push({ first: seen.get(key), second: { index, name: item.name }, scope: scopeOf(item) });
    } else {
      seen.set(key, { index, name: item.name });
    }
  });

  if (duplicates.length > 0) {
    log(`❌ Near-duplicate ${type} names (differ only in case, spacing or punctuation):`, "red");
    duplicates.forEach(({ first, second, scope }) => {
      log(`   - "${first.name}" (index ${first.index}) vs "${second.name}" (index ${second.index}) in ${scope}`, "red");
    });
    return false;
  }
  log(`✅ No near-duplicate ${type} names`, "green");
  return true;
}

function validateNameWhitespace(data, type, fields) {
  const bad = [];

  data.forEach((item, index) => {
    fields.forEach((field) => {
      const value = item[field];
      if (typeof value === "string" && (value !== value.trim() || /\s{2,}/.test(value))) {
        bad.push({ field, value, index });
      }
    });
  });

  if (bad.length > 0) {
    log(`❌ Leading, trailing or repeated spaces in ${type}:`, "red");
    bad.forEach(({ field, value, index }) => {
      log(`   - ${field} ${JSON.stringify(value)} (index ${index})`, "red");
    });
    return false;
  }
  log(`✅ No stray whitespace in ${type}`, "green");
  return true;
}

// Codes must run 1..expected with no gaps, zero-padded to `width` digits.
function validateCodeSequence(data, type, expected, width) {
  const codes = new Set(data.map((item) => item.code));
  const missing = [];
  for (let i = 1; i <= expected; i++) {
    const code = String(i).padStart(width, "0");
    if (!codes.has(code)) missing.push(code);
  }
  const malformed = data
    .map((item) => item.code)
    .filter((code) => !new RegExp(`^\\d{${width}}$`).test(code) || Number(code) < 1 || Number(code) > expected);

  const ok = data.length === expected && missing.length === 0 && malformed.length === 0;
  if (!ok) {
    log(`❌ ${type}: expected ${expected} records coded ${"1".padStart(width, "0")}–${String(expected).padStart(width, "0")}, found ${data.length}`, "red");
    if (missing.length) log(`   - missing codes: ${missing.join(", ")}`, "red");
    if (malformed.length) log(`   - unexpected codes: ${malformed.join(", ")}`, "red");
    return false;
  }
  log(`✅ ${type} codes run ${"1".padStart(width, "0")}–${String(expected).padStart(width, "0")} with no gaps`, "green");
  return true;
}

const VALID_REGIONS = new Set([
  "Nairobi",
  "Central",
  "Coast",
  "Eastern",
  "North Eastern",
  "Nyanza",
  "Rift Valley",
  "Western",
]);

function validateCountyRegions(counties) {
  const invalid = counties.filter((c) => !VALID_REGIONS.has(c.region));
  if (invalid.length > 0) {
    log("❌ Counties with invalid region values:", "red");
    invalid.forEach((c) =>
      log(`   - ${c.name}: "${c.region}"`, "red")
    );
    return false;
  }
  log("✅ All county region values are valid", "green");
  return true;
}

function validateDataIntegrity() {
  log("🔍 Starting data validation...", "blue");
  log("", "reset");

  const data = loadData();
  let allValid = true;

  // Validate required fields
  log("📋 Checking required fields...", "yellow");
  allValid &= validateRequiredFields(data.counties, "counties", [
    "code",
    "name",
    "capital",
    "area_km2",
    "population_2019",
    "region",
    "postal_code",
  ]);
  allValid &= validateRequiredFields(data.constituencies, "constituencies", [
    "code",
    "name",
    "county",
  ]);
  allValid &= validateRequiredFields(data.wards, "wards", [
    "code",
    "name",
    "constituency",
  ]);
  allValid &= validateRequiredFields(data.subCounties, "sub-counties", [
    "code",
    "name",
    "county",
  ]);
  allValid &= validateRequiredFields(data.localities, "localities", [
    "name",
    "county",
  ]);
  allValid &= validateRequiredFields(data.areas, "areas", [
    "name",
    "locality",
    "county",
  ]);
  log("", "reset");

  // Validate county region values
  log("📋 Checking county region values...", "yellow");
  allValid &= validateCountyRegions(data.counties);
  log("", "reset");

  // Validate unique IDs
  log("📋 Checking for duplicate IDs...", "yellow");
  allValid &= validateUniqueIds(data.counties, "counties", "code");
  allValid &= validateUniqueIds(data.constituencies, "constituencies", "code");
  allValid &= validateUniqueIds(data.wards, "wards", "code");
  allValid &= validateUniqueIds(data.subCounties, "sub-counties", "code");
  log("", "reset");

  // Official IEBC totals: 47 counties, 290 constituencies, 1,450 wards
  log("📋 Checking code sequences against official totals...", "yellow");
  allValid &= validateCodeSequence(data.counties, "counties", 47, 3);
  allValid &= validateCodeSequence(data.constituencies, "constituencies", 290, 3);
  allValid &= validateCodeSequence(data.wards, "wards", 1450, 4);
  log("", "reset");

  log("📋 Checking names for stray whitespace...", "yellow");
  allValid &= validateNameWhitespace(data.counties, "counties", ["name"]);
  allValid &= validateNameWhitespace(data.constituencies, "constituencies", ["name", "county"]);
  allValid &= validateNameWhitespace(data.wards, "wards", ["name", "constituency"]);
  allValid &= validateNameWhitespace(data.subCounties, "sub-counties", ["name", "county"]);
  allValid &= validateNameWhitespace(data.localities, "localities", ["name", "county"]);
  allValid &= validateNameWhitespace(data.areas, "areas", ["name", "locality", "county"]);
  log("", "reset");

  log("📋 Checking for near-duplicate names...", "yellow");
  allValid &= validateNoNearDuplicates(data.localities, "locality", (l) => l.county);
  allValid &= validateNoNearDuplicates(data.areas, "area", (a) => `${a.county}/${a.locality}`);
  log("", "reset");

  // Validate locality uniqueness within counties
  log("📋 Checking locality uniqueness within counties...", "yellow");
  allValid &= validateLocalityUniqueness(data.localities);
  log("", "reset");

  // Validate area uniqueness within localities
  log("📋 Checking area uniqueness within localities...", "yellow");
  allValid &= validateAreaUniqueness(data.areas);
  log("", "reset");

  // Validate references
  log("🔗 Checking reference integrity...", "yellow");
  allValid &= validateReferences(
    data.subCounties,
    "sub-counties",
    "county",
    data.counties,
    "counties"
  );
  allValid &= validateReferences(
    data.localities,
    "localities",
    "county",
    data.counties,
    "counties"
  );
  allValid &= validateReferences(
    data.areas,
    "areas",
    "county",
    data.counties,
    "counties"
  );
  allValid &= validateConstituencyReferences(
    data.constituencies,
    data.counties
  );
  allValid &= validateReferences(
    data.wards,
    "wards",
    "constituency",
    data.constituencies,
    "constituencies"
  );
  allValid &= validateLocalityAreaReferences(data.areas, data.localities);
  log("", "reset");

  // Summary
  if (allValid) {
    log(
      "🎉 All validations passed! Your data is ready for submission.",
      "green"
    );
    log("", "reset");
    log("📊 Data Summary:", "blue");
    log(`   - Counties: ${data.counties.length}`, "reset");
    log(`   - Sub-Counties: ${data.subCounties.length}`, "reset");
    log(`   - Constituencies: ${data.constituencies.length}`, "reset");
    log(`   - Wards: ${data.wards.length}`, "reset");
    log(`   - Localities: ${data.localities.length}`, "reset");
    log(`   - Areas: ${data.areas.length}`, "reset");
  } else {
    log(
      "❌ Validation failed! Please fix the issues above before submitting.",
      "red"
    );
    process.exit(1);
  }
}

validateDataIntegrity();
