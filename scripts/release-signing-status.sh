#!/usr/bin/env bash
# Decide release labels without exposing any certificate material. The release
# workflow uses these values to run signing checks only when an operator has
# supplied the matching credentials.
set -euo pipefail

macos="unsigned"
windows="unsigned"

if [[ -n "${APPLE_CERTIFICATE:-}" && -n "${APPLE_CERTIFICATE_PASSWORD:-}" && -n "${APPLE_SIGNING_IDENTITY:-}" && -n "${APPLE_ID:-}" && -n "${APPLE_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" ]]; then
  macos="signed-and-notarized"
fi

if [[ -n "${WINDOWS_CERT_PFX:-}" && -n "${WINDOWS_CERTIFICATE_PASSWORD:-}" ]]; then
  windows="authenticode-signed"
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  printf 'macos=%s\nwindows=%s\n' "$macos" "$windows" >> "$GITHUB_OUTPUT"
else
  printf 'macos=%s\nwindows=%s\n' "$macos" "$windows"
fi
