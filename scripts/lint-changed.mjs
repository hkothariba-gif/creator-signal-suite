import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const base = process.argv[2] || process.env.LINT_BASE_REF || "HEAD^";
const diff = spawnSync("git", ["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`], {
  encoding: "utf8",
});

if (diff.status !== 0) {
  process.stderr.write(diff.stderr || `Could not compare changed files with ${base}.\n`);
  process.exit(diff.status || 1);
}

const lintable = diff.stdout
  .split("\n")
  .filter((file) => /\.(?:[cm]?js|jsx|ts|tsx)$/.test(file) && existsSync(file));

if (lintable.length === 0) {
  console.log("No changed JavaScript or TypeScript files to lint.");
  process.exit(0);
}

const lint = spawnSync("npx", ["eslint", "--max-warnings=0", ...lintable], {
  stdio: "inherit",
});
process.exit(lint.status || 0);
