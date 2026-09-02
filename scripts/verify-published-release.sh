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
  .signatures.macos == "no_developer_id" and .signatures.windows == "not_signed" and
  (.platforms.macos | type == "array" and length == 2) and
  (.platforms.windows | type == "array" and length == 2) and
  (.platforms.linux | type == "array" and length == 3) and
  ([.platforms.macos[].name] | any(test("(aarch64|arm64)"; "i"))) and
  ([.platforms.macos[].name] | any(test("(x86_64|x64|intel)"; "i"))) and
  ([.platforms.windows[].name] | any(test("\\.msi$"; "i"))) and
  ([.platforms.windows[].name] | any(test("\\.exe$"; "i"))) and
  ([.platforms.linux[].name] | any(test("\\.AppImage$"; "i"))) and
  ([.platforms.linux[].name] | any(test("\\.deb$"; "i"))) and
  ([.platforms.linux[].name] | any(test("\\.rpm$"; "i")))
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
  expected=$(awk -v name="$asset" '$2 == name { print $1; count += 1 } END { if (count != 1) exit 1 }' "$checksums") || {
    echo "SHA256SUMS has no entry for $asset." >&2
    exit 1
  }
  if ! [[ "$expected" =~ ^[[:xdigit:]]{64}$ ]]; then
    echo "SHA256SUMS has an invalid SHA-256 for $asset." >&2
    exit 1
  fi

  downloaded="$work_dir/$asset"
  fetch "$(asset_url "$asset")" "$downloaded"
  actual=$(sha256sum "$downloaded" | awk '{ print $1 }')
  if [ "$expected" != "$actual" ]; then
    echo "Published SHA-256 mismatch for $asset." >&2
    exit 1
  fi
done < "$work_dir/release-assets"

echo "Verified public ${RELEASE_TAG}: tag, target commit, latest.json, every package name, and every published SHA-256 agree."
