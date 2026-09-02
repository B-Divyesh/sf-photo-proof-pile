#!/usr/bin/env bash
set -euo pipefail

site_dir=${1:?Pass the prepared release-site directory.}
: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${RELEASE_COMMIT:?RELEASE_COMMIT is required}"
: "${REPOSITORY:?REPOSITORY is required}"

fail() {
  echo "Deployment site verification failed: $*" >&2
  exit 1
}

[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "release tag is not a stable version."
[[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "release commit is not a full Git commit."
[ -d "$site_dir" ] || fail "$site_dir is not a directory."

for required in index.html 404.html install.sh install.ps1 sw.js staticwebapp.config.json; do
  [ -f "$site_dir/$required" ] || fail "$required is missing."
done

expected_version=${RELEASE_TAG#v}
grep -Fq "expected_tag=\"$RELEASE_TAG\"" "$site_dir/install.sh" || fail "Linux installer release tag does not match $RELEASE_TAG."
grep -Fq "expected_commit=\"$RELEASE_COMMIT\"" "$site_dir/install.sh" || fail "Linux installer source does not match $RELEASE_COMMIT."
grep -Fq "\$expectedTag = \"$RELEASE_TAG\"" "$site_dir/install.ps1" || fail "Windows installer release tag does not match $RELEASE_TAG."
grep -Fq "\$expectedCommit = \"$RELEASE_COMMIT\"" "$site_dir/install.ps1" || fail "Windows installer source does not match $RELEASE_COMMIT."
grep -Fq "<p>v${expected_version}</p>" "$site_dir/404.html" || fail "404 release version does not match $RELEASE_TAG."
grep -Fq "const CACHE = \"proof-pile-v${expected_version}\";" "$site_dir/sw.js" || fail "service-worker cache does not match $RELEASE_TAG."

if grep -R -E -q "__PROOF_PILE_RELEASE_(VERSION|COMMIT)__" "$site_dir"; then
  fail "an unstamped release placeholder remains."
fi

app_identity=""
while IFS= read -r -d '' script; do
  if grep -Fq "$RELEASE_COMMIT" "$script" && grep -Fq "$expected_version" "$script"; then
    [ -z "$app_identity" ] || fail "more than one application bundle contains the release identity."
    app_identity=$script
  fi
done < <(find "$site_dir/assets" -maxdepth 1 -type f -name '*.js' -print0)
[ -n "$app_identity" ] || fail "application bundle does not contain $RELEASE_TAG at $RELEASE_COMMIT."

work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT

fetch() {
  local url=$1 output=$2
  curl --fail --silent --show-error --location "$url" --output "$output"
}

release_json="$work_dir/release.json"
release_api=${RELEASE_API_URL:-"https://api.github.com/repos/${REPOSITORY}/releases/tags/${RELEASE_TAG}"}
fetch "$release_api" "$release_json"

jq -e --arg tag "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" '
  .tag_name == $tag and .target_commitish == $commit and
  (.assets | type == "array") and
  ([.assets[].name | select(test("\\.dmg$"; "i"))] | length == 2) and
  ([.assets[].name | select(test("\\.msi$"; "i"))] | length == 1) and
  ([.assets[].name | select(test("\\.exe$"; "i"))] | length == 1) and
  ([.assets[].name | select(test("\\.AppImage$"; "i"))] | length == 1) and
  ([.assets[].name | select(test("\\.deb$"; "i"))] | length == 1) and
  ([.assets[].name | select(test("\\.rpm$"; "i"))] | length == 1) and
  ([.assets[].name | select(. == "SHA256SUMS")] | length == 1) and
  ([.assets[].name | select(. == "latest.json")] | length == 1)
' "$release_json" >/dev/null || fail "the public desktop release does not match this site or its complete package matrix."

immutable_base="https://github.com/${REPOSITORY}/releases/download/${RELEASE_TAG}/"
jq -e --arg base "$immutable_base" '
  ([.assets[] | select(.name | test("\\.(dmg|msi|exe|AppImage|deb|rpm)$"; "i")) |
    .browser_download_url == ($base + .name)] | length) == 7 and
  ([.assets[] | select(.name | test("\\.(dmg|msi|exe|AppImage|deb|rpm)$"; "i")) |
    .browser_download_url == ($base + .name)] | all)
' "$release_json" >/dev/null || fail "a public package URL is not under the immutable release tag."

manifest_url=$(jq -er '.assets[] | select(.name == "latest.json") | .browser_download_url' "$release_json")
manifest_json="$work_dir/latest.json"
fetch "${RELEASE_MANIFEST_URL:-$manifest_url}" "$manifest_json"
jq -e --arg tag "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" --arg base "$immutable_base" '
  .version == $tag and .commit == $commit and
  (.platforms.macos | length == 2) and
  (.platforms.windows | length == 2) and
  (.platforms.linux | length == 3) and
  ([.platforms | to_entries[] | .value[] | .url == ($base + .name)] | length) == 7 and
  ([.platforms | to_entries[] | .value[] | .url == ($base + .name)] | all)
' "$manifest_json" >/dev/null || fail "latest.json does not match this deployment identity."

echo "Verified deployment site ${RELEASE_TAG} at ${RELEASE_COMMIT}: site, installers, public release, and manifest agree."
