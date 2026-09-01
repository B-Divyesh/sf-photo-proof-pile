#!/usr/bin/env bash
set -euo pipefail

input_dir=${1:?Pass the downloaded artifact directory.}
output_dir="$input_dir/published"
: "${RELEASE_TAG:?RELEASE_TAG is required}"
: "${RELEASE_COMMIT:?RELEASE_COMMIT is required}"
: "${REPOSITORY:?REPOSITORY is required}"

mkdir -p "$output_dir"
while IFS= read -r -d '' asset; do
  name=$(basename "$asset" | tr ' ' '-')
  if [ -e "$output_dir/$name" ]; then
    echo "Duplicate release asset name: $name" >&2
    exit 1
  fi
  cp "$asset" "$output_dir/$name"
done < <(find "$input_dir" -path "$output_dir" -prune -o -type f \( -name '*.dmg' -o -name '*.msi' -o -name '*.exe' -o -name '*.AppImage' -o -name '*.deb' -o -name '*.rpm' \) -print0)

cd "$output_dir"
find . -maxdepth 1 -type f \( -name '*.dmg' -o -name '*.msi' -o -name '*.exe' -o -name '*.AppImage' -o -name '*.deb' -o -name '*.rpm' \) -print0 | sort -z | xargs -0 sha256sum | sed 's#  \./#  #' > SHA256SUMS
download_base="https://github.com/${REPOSITORY}/releases/download/${RELEASE_TAG}"
macos=$(find . -maxdepth 1 -type f -name '*.dmg' -printf '%f\n' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')
windows=$(find . -maxdepth 1 -type f \( -name '*.msi' -o -name '*.exe' \) -printf '%f\n' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')
linux=$(find . -maxdepth 1 -type f \( -name '*.AppImage' -o -name '*.deb' -o -name '*.rpm' \) -printf '%f\n' | sort | jq -Rsc 'split("\n") | map(select(length > 0))')
jq -n --arg version "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" --arg base "$download_base" --argjson macos "$macos" --argjson windows "$windows" --argjson linux "$linux" \
  '{version: $version, commit: $commit, signatures: {macos: "unsigned", windows: "unsigned"}, platforms: {macos: ($macos | map({name: ., url: ($base + "/" + .)})), windows: ($windows | map({name: ., url: ($base + "/" + .)})), linux: ($linux | map({name: ., url: ($base + "/" + .)}))}}' > latest.json
jq -e --arg tag "$RELEASE_TAG" --arg commit "$RELEASE_COMMIT" '.version == $tag and .commit == $commit and .signatures.macos == "unsigned" and .signatures.windows == "unsigned" and (.platforms.macos | length) >= 2 and (.platforms.windows | length) >= 1 and (.platforms.linux | length) >= 2' latest.json
sha256sum -c SHA256SUMS
