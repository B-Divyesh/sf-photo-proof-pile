#!/usr/bin/env bash
set -euo pipefail

: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${RELEASE_COMMIT:?RELEASE_COMMIT is required}"
: "${REPOSITORY:?REPOSITORY is required}"

api_url="${RELEASE_API_URL:-https://api.github.com/repos/${REPOSITORY}/releases/tags/${RELEASE_TAG}}"
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

fetch() {
  local url=$1 output=$2 attempt=1
  while ! curl --fail --silent --show-error --location "$url" --output "$output"; do
    if [ "$attempt" -ge 10 ]; then
      echo "Could not fetch published release evidence: $url" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
}

release_json="$work_dir/release.json"
fetch "$api_url" "$release_json"
jq -e --arg tag "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" '
  .tag_name == $tag and .target_commitish == $commit and (.assets | type == "array")
' "$release_json" >/dev/null || {
  echo "Published release tag or target commit does not match the build identity." >&2
  exit 1
}

asset_url() {
  jq -er --arg name "$1" '.assets[] | select(.name == $name) | .browser_download_url' "$release_json"
}

manifest_json="$work_dir/latest.json"
checksums="$work_dir/SHA256SUMS"
fetch "$(asset_url latest.json)" "$manifest_json"
fetch "$(asset_url SHA256SUMS)" "$checksums"

jq -e --arg tag "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" '
  .version == $tag and .commit == $commit and
  (.platforms.macos | type == "array" and length >= 2) and
  (.platforms.windows | type == "array" and length >= 1) and
  (.platforms.linux | type == "array" and length >= 2)
' "$manifest_json" >/dev/null || {
  echo "latest.json does not match the release identity or platform matrix." >&2
  exit 1
}

expected_base="https://github.com/${REPOSITORY}/releases/download/${RELEASE_TAG}/"
jq -e --arg base "$expected_base" '
  [
    .platforms | to_entries[] | .value[] |
    ((.name | type) == "string") and
    ((.url | type) == "string") and
    (.url == ($base + .name))
  ] | length > 0 and all
' "$manifest_json" >/dev/null || {
  echo "latest.json contains a package URL outside this immutable release." >&2
  exit 1
}

jq -r '.platforms | to_entries[] | .value[] | .name' "$manifest_json" | sort -u > "$work_dir/manifest-assets"
jq -r '.assets[] | select(.name | test("\\.(dmg|msi|exe|AppImage|deb|rpm)$"; "i")) | .name' "$release_json" | sort -u > "$work_dir/release-assets"
if ! cmp -s "$work_dir/manifest-assets" "$work_dir/release-assets"; then
  echo "latest.json package names do not match the public release assets." >&2
  exit 1
fi

while IFS= read -r asset; do
  awk -v name="$asset" '$2 == name { found = 1 } END { exit found ? 0 : 1 }' "$checksums" || {
    echo "SHA256SUMS has no entry for $asset." >&2
    exit 1
  }
done < "$work_dir/release-assets"

echo "Verified public ${RELEASE_TAG}: tag, target commit, latest.json, package names, and SHA256SUMS agree."
