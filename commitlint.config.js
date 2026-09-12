export default {
  extends: ["@commitlint/config-conventional"],
  helpUrl: "https://www.conventionalcommits.org/en/v1.0.0/",
  rules: {
    // Conventional types plus `data` for shared JSON location updates.
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "data",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
    "header-max-length": [2, "always", 100],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
  },
};
