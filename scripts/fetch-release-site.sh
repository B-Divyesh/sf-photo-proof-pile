#!/usr/bin/env bash
set -euo pipefail

run_id=${1:?Pass the successful release workflow run ID.}
output_dir=${2:?Pass an empty output directory.}
: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${RELEASE_COMMIT:?RELEASE_COMMIT is required}"
: "${REPOSITORY:?REPOSITORY is required}"

[[ "$run_id" =~ ^[0-9]+$ ]] || { echo "Release workflow run ID must be numeric." >&2; exit 1; }
case "$output_dir" in /|.|..) echo "Refusing unsafe output directory: $output_dir" >&2; exit 1 ;; esac
mkdir -p "$output_dir"
[ -z "$(find "$output_dir" -mindepth 1 -maxdepth 1 -print -quit)" ] || {
  echo "Release-site output directory must be empty: $output_dir" >&2
  exit 1
}

work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
auth_args=()
if [ -n "${GITHUB_TOKEN:-}" ]; then
  auth_args=(-H "Authorization: Bearer $GITHUB_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28")
fi

fetch() {
  local url=$1 output=$2
  curl --fail --silent --show-error --location "${auth_args[@]}" "$url" --output "$output"
}

api_base="https://api.github.com/repos/${REPOSITORY}/actions"
run_json="$work_dir/run.json"
artifacts_json="$work_dir/artifacts.json"
fetch "${ACTIONS_RUN_API_URL:-${api_base}/runs/${run_id}}" "$run_json"
fetch "${ACTIONS_ARTIFACTS_API_URL:-${api_base}/runs/${run_id}/artifacts}" "$artifacts_json"

jq -e --argjson run "$run_id" --arg commit "$RELEASE_COMMIT" '
  .id == $run and .status == "completed" and .conclusion == "success" and
  .head_sha == $commit and .path == ".github/workflows/release.yml"
' "$run_json" >/dev/null || {
  echo "Release workflow run is not a successful build of $RELEASE_COMMIT." >&2
  exit 1
}

jq -e '[.artifacts[] | select(.name == "release-site" and .expired == false)] | length == 1' "$artifacts_json" >/dev/null || {
  echo "Release workflow run has no single unexpired release-site artifact." >&2
  exit 1
}
artifact_url=$(jq -er '.artifacts[] | select(.name == "release-site" and .expired == false) | .archive_download_url' "$artifacts_json")
fetch "$artifact_url" "$work_dir/release-site.zip"
unzip -q "$work_dir/release-site.zip" -d "$output_dir"

bash "$(dirname "$0")/verify-deployment-site.sh" "$output_dir"
echo "Prepared the verified release-site artifact from workflow run $run_id in $output_dir."
