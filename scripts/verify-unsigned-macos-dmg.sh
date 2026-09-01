#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Pass one or more macOS DMG paths." >&2
  exit 2
fi

for dmg in "$@"; do
  mount_dir=$(mktemp -d)
  detach() {
    hdiutil detach "$mount_dir" -quiet >/dev/null 2>&1 || true
    rmdir "$mount_dir" >/dev/null 2>&1 || true
  }
  trap detach EXIT
  hdiutil attach -readonly -nobrowse -mountpoint "$mount_dir" "$dmg" -quiet
  app=$(find "$mount_dir" -maxdepth 1 -type d -name '*.app' -print -quit)
  if [ -z "$app" ]; then
    echo "No application bundle found in $dmg." >&2
    exit 1
  fi
  signature=$(codesign -dv --verbose=4 "$app" 2>&1 || true)
  if printf '%s\n' "$signature" | grep -Eq '^Authority=|^TeamIdentifier=[^[:space:]]+'; then
    echo "Expected an unsigned macOS package, but $dmg has a signing authority." >&2
    exit 1
  fi
  detach
  trap - EXIT
done

echo "Verified macOS packages have no Developer ID signing authority."
