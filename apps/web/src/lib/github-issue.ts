export const DATA_ISSUE_REPO = "davidamunga/kenya-locations";

export function buildAreaIssueUrl(input: {
  county: string;
  locality: string;
  area: string;
}): string {
  const county = input.county.trim();
  const locality = input.locality.trim();
  const area = input.area.trim();

  const title = `[DATA] Add area: ${area} (${locality}, ${county})`;
  const body = `## Data Type

- [ ] New County Data
- [ ] New Localities
- [x] New Areas
- [ ] New Sub-Counties
- [ ] New Constituencies
- [ ] New Wards
- [ ] Data Correction/Update

## Location Details

**County**: ${county}
**Locality**: ${locality}
**Area**: ${area}

## Data to Add/Update

\`\`\`typescript
{
  name: "${area}",
  locality: "${locality}"
}
\`\`\`

## Data Source

- [ ] IEBC (Independent Electoral and Boundaries Commission)
- [ ] KNBS (Kenya National Bureau of Statistics)
- [ ] County Government Records
- [ ] Personal Knowledge (verified)
- [ ] Other: [Please specify]

**Source Link** (if available):

## Verification

- [ ] I have verified this data is accurate
- [ ] I have checked for duplicates in existing data
- [ ] I have followed the data format in CONTRIBUTING.md
- [ ] I have checked the spelling and formatting
`;

  const params = new URLSearchParams({
    title,
    labels: "data,contribution",
    body,
  });

  return `https://github.com/${DATA_ISSUE_REPO}/issues/new?${params}`;
}
