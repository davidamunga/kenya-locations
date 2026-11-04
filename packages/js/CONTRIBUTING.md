# 🤝 Contributing to Kenya Locations

Thank you for your interest in contributing to the Kenya Locations library! This guide will help you
understand how to add or update data in the library.

## 📋 Table of Contents

- [Overview](#overview)
- [Data Structure](#data-structure)
- [Adding New Data](#adding-new-data)
- [Data Validation](#data-validation)
- [Testing Your Changes](#testing-your-changes)
- [Submission Guidelines](#submission-guidelines)
- [Data Sources](#data-sources)

## 🎯 Overview

The Kenya Locations library maintains data for Kenya's administrative divisions in a hierarchical
structure:

```
County (47 counties)
├── Sub-County
├── Constituency
│   └── Ward
├── Locality
│   └── Area
```

All data is stored in the shared `data/*.json` files at the repository root and is used by every
package (JS, React, Kotlin, Swift, Dart, PHP).

## 📊 Data Structure

The data lives in the shared `data/*.json` files at the repository root, not in this package. The
format, codes, parent links and validation rules are documented in
[`data/README.md`](../../data/README.md).

## ➕ Adding New Data

Edit the JSON in `data/` and follow [Changing the data](../../data/README.md#changing-the-data):

```bash
pnpm validate          # schema, codes, parent links
pnpm data:sync         # refresh every package's copy
pnpm changeset:data    # write the changeset from the diff
```

Every new record needs its parent codes (`county_code`, and `constituency_code` for wards). If you
rename, merge or remove an existing code, add an entry to `data/history.json`.

## ✅ Data Validation

### Required Checks

Before submitting your changes, ensure:

1. **Exact Name Matching**: All references between files use exact names

   - County names in sub-counties, localities, and areas must match `counties.ts`
   - Locality names in areas must match `locality.ts`
   - Constituency names in wards must match `constituencies.ts`

2. **Unique Codes**: All codes must be unique within their category

   - County codes are official government codes
   - Constituency codes are official IEBC codes
   - Ward codes are official IEBC codes
   - Sub-county codes should follow a logical pattern

3. **Proper Formatting**:

   - Use double quotes for strings
   - Follow existing indentation (2 spaces)
   - Maintain alphabetical order where applicable
   - No trailing commas on the last item

4. **Official Names**: Use official government names, not colloquial names
   - Check IEBC website for constituencies and wards
   - Check government gazettes for sub-counties
   - Use commonly accepted names for localities and areas

### Example Validation

```typescript
// ❌ Wrong - name mismatch
{ name: "Gigiri", locality: "Westland", county: "Nairobi" } // "Westland" should be "Westlands"

// ✅ Correct
{ name: "Gigiri", locality: "Westlands", county: "Nairobi" }
```

## 🧪 Testing Your Changes

### 1. Build the Project

```bash
pnpm run build
```

### 2. Run Tests

```bash
pnpm  test
```

### 3. Validate Data Integrity

We provide a validation script to check your data:

```bash
pnpm run validate
```

This script will:

- ✅ Check for duplicate codes/names within appropriate contexts
- ✅ Verify all references between files are valid
- ✅ Ensure proper data structure
- ✅ Display a summary of all data

**Note**: The script allows duplicate locality names across different counties and duplicate area
names across different localities, as this reflects real-world naming patterns in Kenya.

### 4. Pre-commit Hooks

This project uses automated pre-commit hooks to ensure code quality and data integrity. When you
make a commit, the following will happen automatically:

- **Code Formatting**: ESLint and Prettier will check and fix your code
- **Data Validation**: If you've changed data files, they'll be validated automatically
- **Tests**: The test suite will run to ensure nothing is broken
- **Commit Message**: [commitlint](https://commitlint.js.org/) checks Conventional Commits (plus a
  `data` type). Rules are in [`commitlint.config.js`](../../commitlint.config.js); agent-facing
  summary is in [`AGENTS.md`](../../AGENTS.md).
- **Changeset**: Data and package-source PRs need `pnpm changeset`. See
  [`RELEASING.md`](../../RELEASING.md).

**Example commit messages:**

```bash
git commit -m "data(nairobi): add new localities in Westlands"
git commit -m "feat(search): improve search performance"
git commit -m "fix(validation): handle duplicate names correctly"
```

### 5. Test Search Functionality

Create a simple test file to verify your data works with the search:

```javascript
import { search, getLocalityByName, getAreaByName } from "./dist/index.es.js";

// Test your new locality
const locality = getLocalityByName("YourNewLocality");
console.log(locality);

// Test your new area
const area = getAreaByName("YourNewArea");
console.log(area);

// Test search
const results = search("YourNewLocation");
console.log(results);
```

### 6. Verify Relationships

Ensure all relationships work correctly:

```javascript
import { county } from "./dist/index.es.js";

const nairobi = county("Nairobi");

// Test locality access
const localities = nairobi?.localities();
console.log(localities.find((l) => l.name === "YourNewLocality"));

// Test area access
const areas = nairobi?.areas();
console.log(areas.find((a) => a.name === "YourNewArea"));
```

## 📝 Submission Guidelines

### 1. Fork and Clone

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your changes

```bash
git checkout -b add-new-locations
```

### 2. Make Changes

1. Add your data following the structure above
2. Ensure all validation checks pass
3. Test your changes thoroughly

### 3. Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (plus `data` for JSON):

```bash
git commit -m "data(kiambu): add localities and areas"
git commit -m "data(nairobi): update Westlands ward entries"
git commit -m "data(nakuru): add missing sub-counties"
```

Then `pnpm changeset` and pick the core packages (JS / Kotlin / Swift bump together).

### 4. Pull Request

1. Push your changes to your fork
2. Create a pull request with:
   - Clear title describing what you added
   - List of specific locations added
   - Data sources used
   - Confirmation that tests pass

**Pull Request Template:**

```markdown
## Changes Made

- Added 5 new localities in Kiambu County
- Added 15 new areas in Westlands locality
- Updated ward codes for Dagoretti constituency

## Data Sources

- IEBC official website for ward codes
- Kenya National Bureau of Statistics for locality names
- Local government records for area names

## Testing

- [x] All tests pass
- [x] Build succeeds
- [x] Search functionality works for new data
- [x] Relationships are correctly established

## Validation

- [x] All names match exactly between files
- [x] All codes are unique
- [x] Official names used
- [x] Proper formatting followed
```

## 📚 Data Sources

### Official Sources

1. **Counties**: [Kenya National Bureau of Statistics](https://www.knbs.or.ke/)
2. **Constituencies & Wards**:
   [Independent Electoral and Boundaries Commission (IEBC)](https://www.iebc.or.ke/)
3. **Sub-Counties**: Kenya Gazette notices and county government websites
4. **Localities & Areas**: Local government records, postal service data, commonly accepted names

### Verification

When adding data, please verify from multiple sources:

1. Cross-check with official government websites
2. Verify with local government records
3. Confirm with postal service databases
4. Use commonly accepted local names

### Data Quality Standards

- **Accuracy**: Use official, verified names and codes
- **Completeness**: Ensure all required fields are filled
- **Consistency**: Follow existing naming conventions
- **Currency**: Use the most recent official data

## 🆘 Getting Help

If you need help or have questions:

1. **Check existing issues** on GitHub
2. **Create a new issue** with the "question" label
3. **Contact the maintainer**: David Amunga ([website](https://davidamunga.com))

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same
license as the project.

---

Thank you for helping make Kenya Locations more comprehensive and accurate! 🇰🇪
