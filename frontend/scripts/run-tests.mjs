import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  API_BASE_URL: "",
  NEXT_PUBLIC_API_BASE_URL: "",
};

function run(args) {
  const result = spawnSync(process.execPath, args, {
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// SSR fixtures use the local-only CMS mode, not a developer's configured API.
run(["scripts/run-cli.mjs", "vinext", "build"]);
run(["--test", "tests/cli-launcher.test.mjs"]);
run(["--test", "tests/rendered-html.test.mjs"]);
run([
  "--import",
  "tsx",
  "--test",
  "tests/cms-utils.test.ts",
  "tests/content-api.test.ts",
  "tests/settings-utils.test.ts",
  "tests/public-application-api.test.ts",
  "tests/students-api.test.ts",
]);
