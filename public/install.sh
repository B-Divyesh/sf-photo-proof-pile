#!/bin/sh
set -eu

repo="B-Divyesh/sf-photo-proof-pile"
api="https://api.github.com/repos/$repo/releases?per_page=1"
release_json=$(mktemp)
checksums=$(mktemp)
release_marker=$(mktemp)
trap 'rm -f "$release_json" "$checksums" "$release_marker"' EXIT

if ! curl -fsSL "$api" -o "$release_json"; then
  echo "A verified Linux release is not published yet. Nothing was installed." >&2
  exit 1
fi
asset_url=$(sed -n 's/.*"browser_download_url": "\([^"]*\.AppImage\)".*/\1/p' "$release_json" | head -n 1)
checksum_url=$(sed -n 's/.*"browser_download_url": "\([^"]*SHA256SUMS\)".*/\1/p' "$release_json" | head -n 1)
marker_url=$(sed -n 's/.*"browser_download_url": "\([^"]*DESKTOP_RELEASE_VERIFIED\.json\)".*/\1/p' "$release_json" | head -n 1)

if [ -z "$asset_url" ] || [ -z "$checksum_url" ] || [ -z "$marker_url" ]; then
  echo "A verified Linux release is not published yet. Nothing was installed." >&2
  exit 1
fi

curl -fsSL "$marker_url" -o "$release_marker"
if ! grep -Eq '"matrix"[[:space:]]*:[[:space:]]*"complete"' "$release_marker" || ! grep -Eq '"checksums"[[:space:]]*:[[:space:]]*"sha256"' "$release_marker"; then
  echo "Desktop release verification is incomplete. Nothing was installed." >&2
  exit 1
fi

target_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
mkdir -p "$target_dir"
target="$target_dir/proof-pile.AppImage"
curl -fL "$asset_url" -o "$target"
curl -fsSL "$checksum_url" -o "$checksums"
asset_name=${asset_url##*/}
expected=$(awk -v suffix="  $asset_name" 'index($0, suffix) == length($0) - length(suffix) + 1 {print substr($0, 1, 64)}' "$checksums")
actual=$(sha256sum "$target" | awk '{print $1}')
if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
  rm -f "$target"
  echo "Checksum verification failed. Nothing was installed." >&2
  exit 1
fi
chmod +x "$target"
echo "Installed Proof Pile at $target"
