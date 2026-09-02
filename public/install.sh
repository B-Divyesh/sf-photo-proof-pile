#!/bin/sh
set -eu

repo="B-Divyesh/sf-photo-proof-pile"
expected_tag="v__PROOF_PILE_RELEASE_VERSION__"
expected_commit="__PROOF_PILE_RELEASE_COMMIT__"
api="https://api.github.com/repos/$repo/releases/tags/$expected_tag"
release_json=$(mktemp)
checksums=$(mktemp)
manifest=$(mktemp)
trap 'rm -f "$release_json" "$checksums" "$manifest"' EXIT

if ! curl -fsSL "$api" -o "$release_json"; then
  echo "A Linux release is not published yet. Nothing was installed." >&2
  exit 1
fi
release_tag=$(sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' "$release_json" | head -n 1)
release_commit=$(sed -n 's/.*"target_commitish": *"\([^"]*\)".*/\1/p' "$release_json" | head -n 1)
asset_url=$(sed -n 's/.*"browser_download_url": "\([^"]*\.AppImage\)".*/\1/p' "$release_json" | head -n 1)
checksum_url=$(sed -n 's/.*"browser_download_url": "\([^"]*SHA256SUMS\)".*/\1/p' "$release_json" | head -n 1)
manifest_url=$(sed -n 's/.*"browser_download_url": "\([^"]*latest.json\)".*/\1/p' "$release_json" | head -n 1)
download_base="https://github.com/$repo/releases/download/$expected_tag/"

if [ "$release_tag" != "$expected_tag" ] || [ "$release_commit" != "$expected_commit" ]; then
  echo "The published Linux package does not match this site build. Nothing was installed." >&2
  exit 1
fi
case "$asset_url" in "$download_base"*.AppImage) ;; *) asset_url="" ;; esac
[ "$checksum_url" = "${download_base}SHA256SUMS" ] || checksum_url=""
[ "$manifest_url" = "${download_base}latest.json" ] || manifest_url=""
if [ -z "$asset_url" ] || [ -z "$checksum_url" ] || [ -z "$manifest_url" ]; then
  echo "A Linux release is not published yet. Nothing was installed." >&2
  exit 1
fi

curl -fsSL "$manifest_url" -o "$manifest"
manifest_tag=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$manifest" | head -n 1)
manifest_commit=$(sed -n 's/.*"commit": *"\([^"]*\)".*/\1/p' "$manifest" | head -n 1)
if [ "$manifest_tag" != "$expected_tag" ] || [ "$manifest_commit" != "$expected_commit" ]; then
  echo "The published Linux manifest does not match this site build. Nothing was installed." >&2
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
