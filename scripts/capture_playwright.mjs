import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex"), "skills", "develop-web-game", "scripts", "web_game_playwright_client.js");
const actionsPath = path.join(root, "playwright_actions.json");
const screenshotDir = path.join(root, "playwright", "main-actions");
const url = process.env.WEB_GAME_URL ?? "http://localhost:4173/?scripted_demo=1&scripted_shop_demo=1&seed=20260223";

const result = spawnSync("node", [client, "--url", url, "--actions-file", actionsPath, "--screenshot-dir", screenshotDir, "--iterations", "5", "--pause-ms", "220"], {
  stdio: "inherit",
  env: process.env
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
