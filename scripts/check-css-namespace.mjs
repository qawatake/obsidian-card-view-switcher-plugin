// main.js に入った Svelte の scope class / `<style id>` が全てこの plugin 固有の prefix を持つか検査する。
// Svelte の既定 (`svelte-${hash(相対 path)}`) のままだと、同じ file 構成の別 plugin
// (例: core-search-assistant の src/ui/CardContainer.svelte) と class と style id が衝突し、
// 先に注入された側の CSS が両方の card view に効いて表示が崩れる。
// prefix は esbuild.config.mjs の CSS_HASH_PREFIX と揃える。
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CSS_HASH_PREFIX = "card-view-switcher-";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = resolve(root, process.argv[2] ?? "main.js");
if (!existsSync(mainPath)) {
  console.error(`css-namespace: ${mainPath} がありません。先に \`pnpm build\` を実行してください。`);
  process.exit(1);
}
const code = readFileSync(mainPath, "utf8");

// Svelte runtime 自体が持つ文字列 (trusted types の policy 名) は対象外。
const allowed = new Set(["svelte-trusted"]);
const defaults = [...new Set(code.match(/\bsvelte-[a-z0-9]{5,}\b/g) ?? [])].filter((c) => !allowed.has(c));
const prefixed = new Set(code.match(new RegExp(`\\b${CSS_HASH_PREFIX}(?=[a-z]*[0-9])[a-z0-9]{5,}\\b`, "g")) ?? []);

if (defaults.length > 0) {
  console.error(`css-namespace: 既定の Svelte scope class が残っています: ${defaults.join(", ")}`);
  process.exit(1);
}
if (prefixed.size === 0) {
  console.error(`css-namespace: ${CSS_HASH_PREFIX}* の scope class が見つかりません。cssHash の設定を確認してください。`);
  process.exit(1);
}
console.log(`css-namespace: ok (${prefixed.size} 個の scope class が ${CSS_HASH_PREFIX} prefix)`);
