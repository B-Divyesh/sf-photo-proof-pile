#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"
# shellcheck source=production-release.env
source "$root/scripts/production-release.env"

fail() {
  echo "Production site build refused: $*" >&2
  exit 1
}

[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "release tag is not a stable version."
[[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]] || fail "release commit is not a full Git commit."
git cat-file -e "${RELEASE_COMMIT}^{tree}" || fail "release commit is unavailable locally."
[ "$(git rev-parse "${RELEASE_TAG}^{}")" = "$RELEASE_COMMIT" ] || fail "release tag does not resolve to the configured source."

source_version=$(git show "${RELEASE_COMMIT}:package.json" | node --input-type=module -e 'import { readFileSync } from "node:fs"; console.log(JSON.parse(readFileSync(0, "utf8")).version)')
release_version=${RELEASE_TAG#v}

work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
git archive "$RELEASE_COMMIT" | tar -x -C "$work_dir"
ln -s "$root/node_modules" "$work_dir/node_modules"
node "$root/scripts/stamp-release-source.mjs" "$work_dir" "$source_version" "$release_version"

BUILD_COMMIT="$RELEASE_COMMIT" npm --prefix "$work_dir" run build:site

site_dir=${PROOF_PILE_OUTPUT_DIR:-"$root/dist/site"}
case "$site_dir" in
  /|.|..) fail "refusing unsafe output directory: $site_dir" ;;
esac
mkdir -p "$(dirname "$site_dir")"
rm -rf "$site_dir"
mv "$work_dir/dist/site" "$site_dir"

RELEASE_TAG="$RELEASE_TAG" RELEASE_COMMIT="$RELEASE_COMMIT" REPOSITORY="$REPOSITORY" \
  bash "$root/scripts/verify-deployment-site.sh" "$site_dir"
echo "Built the verified ${RELEASE_TAG} production site at ${site_dir}."
