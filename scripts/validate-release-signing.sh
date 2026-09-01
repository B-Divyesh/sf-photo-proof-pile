#!/usr/bin/env bash
# Fail before a draft release or package build can exist unless the operator
# has supplied the credentials needed to establish publisher trust on both
# platforms. Values are never printed.
set -euo pipefail

missing=0
for name in APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_SIGNING_IDENTITY APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID WINDOWS_CERT_PFX WINDOWS_CERTIFICATE_PASSWORD; do
  if [[ -z "${!name:-}" ]]; then
    printf 'Missing required signing secret: %s\n' "$name" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  printf 'Refusing to build or publish untrusted desktop packages.\n' >&2
  exit 1
fi
