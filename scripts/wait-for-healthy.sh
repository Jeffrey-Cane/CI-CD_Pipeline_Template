#!/usr/bin/env sh
#
# Poll an HTTP health endpoint until it returns 2xx or a timeout elapses.
#
# Usage: wait-for-healthy.sh [URL] [TIMEOUT_SECONDS] [INTERVAL_SECONDS]
#   URL               health endpoint to poll (default: http://localhost:8080/health)
#   TIMEOUT_SECONDS   max seconds to wait      (default: 60)
#   INTERVAL_SECONDS  seconds between attempts (default: 2)
#
set -eu

URL="${1:-http://localhost:8080/health}"
TIMEOUT="${2:-60}"
INTERVAL="${3:-2}"

elapsed=0

printf 'Waiting for %s to become healthy (timeout %ss)...\n' "$URL" "$TIMEOUT"

while [ "$elapsed" -lt "$TIMEOUT" ]; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$URL" 2>/dev/null || echo 000)"
  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    printf 'Healthy: %s returned HTTP %s after %ss\n' "$URL" "$code" "$elapsed"
    exit 0
  fi
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
  printf '  ...still waiting (%ss elapsed, last status %s)\n' "$elapsed" "$code"
done

printf 'ERROR: %s did not become healthy within %ss\n' "$URL" "$TIMEOUT" >&2
exit 1
