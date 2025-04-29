#!/usr/bin/env bash
#
# Script to extract Obsidian and prepare E2E test directory (macOS only)
# Reference: https://github.com/proog/obsidian-trash-explorer/blob/4d9bc2c4977d79af116b369904c8f68d1c164b28/e2e-setup.sh
#
# - Local           : Extract directly from /Applications/Obsidian.app
# - GitHub Actions  : Get .dmg from GitHub Releases and extract
#
# USAGE (local) : ./scripts/setup-obsidian.sh
# USAGE (ci)    : ./scripts/setup-obsidian.sh --ci
#
# Environment Variables
#   OBSIDIAN_VERSION  Specify a fixed version (e.g., 1.8.10). If not set, uses latest
#   OBSIDIAN_PATH     Override the path to local Obsidian.app
#
set -euo pipefail

root_path="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
vault_path="$root_path/tests/test-vault"
unpacked_path="$root_path/.obsidian-unpacked"
plugin_path="$vault_path/.obsidian/plugins/obsidian-core-search-assistant"

# ------------------------------------------------------------------------------
# 1. Parse arguments
# ------------------------------------------------------------------------------
MODE="local"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ci) MODE="ci";;
    *)    echo "Unknown arg: $1" >&2; exit 1;;
  esac
  shift
done

# ------------------------------------------------------------------------------
# 2. Get Obsidian.app
# ------------------------------------------------------------------------------
if [[ "$MODE" == "local" ]]; then
  obsidian_app="${OBSIDIAN_PATH:-/Applications/Obsidian.app}"
  [[ -d "$obsidian_app" ]] || {
    echo "❌ $obsidian_app not found. Please install Obsidian." >&2
    exit 1
  }
else
  tmp_dir="$(mktemp -d)"
  version="${OBSIDIAN_VERSION:-latest}"
  pattern="Obsidian-*.dmg"

  echo "⏬ Downloading Obsidian ($version) dmg via gh CLI"
  if [[ "$version" == "latest" ]]; then
    gh release download -R obsidianmd/obsidian-releases \
      --pattern "$pattern" --dir "$tmp_dir"
  else
    gh release download -R obsidianmd/obsidian-releases \
      --pattern "$pattern" --dir "$tmp_dir" --tag "v${version}"
  fi

  dmg_path="$(find "$tmp_dir" -name '*.dmg' -type f | head -n1)"
  [[ -n "$dmg_path" ]] || { echo "❌ .dmg not found" >&2; exit 1; }

  echo "📦 Mounting $(basename "$dmg_path")"
  mnt_dir="$tmp_dir/mnt"
  mkdir "$mnt_dir"
  hdiutil attach "$dmg_path" -mountpoint "$mnt_dir" -nobrowse -quiet
  trap 'hdiutil detach "$mnt_dir" -quiet || true' EXIT

  cp -R "$mnt_dir/Obsidian.app" "$tmp_dir/Obsidian.app"
  obsidian_app="$tmp_dir/Obsidian.app"

  hdiutil detach "$mnt_dir" -quiet
  trap - EXIT
fi

# ------------------------------------------------------------------------------
# 3. Extract app.asar and build test folder
# ------------------------------------------------------------------------------
echo "🔓 Unpacking $obsidian_app → $unpacked_path"
rm -rf "$unpacked_path"
npx --yes @electron/asar extract \
    "$obsidian_app/Contents/Resources/app.asar" "$unpacked_path"
cp "$obsidian_app/Contents/Resources/obsidian.asar" \
   "$unpacked_path/obsidian.asar"

echo "✅ Obsidian unpacked"

# ------------------------------------------------------------------------------
# 4. Build plugin and link to Vault
# ------------------------------------------------------------------------------
echo "🔧 Building plugin…"
npm run build --silent
echo "✅ Build done."

echo "🔗 Linking plugin → $plugin_path"
mkdir -p "$plugin_path"
ln -fs "$root_path/manifest.json" "$plugin_path/manifest.json"
ln -fs "$root_path/main.js"       "$plugin_path/main.js"

echo "🎉 setup-obsidian.sh finished!"
