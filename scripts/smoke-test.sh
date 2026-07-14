#!/usr/bin/env sh
#
# Post-deploy smoke test. Verifies the core endpoints and the auth flow return
# the expected status codes against a running instance.
#
# Usage: smoke-test.sh [BASE_URL]
#   BASE_URL  base URL of the deployed app (default: http://localhost:8080)
#
# Env:
#   SMOKE_USER / SMOKE_PASSWORD  credentials for the login check (default: admin/password)
#
set -eu

BASE_URL="${1:-http://localhost:8080}"
SMOKE_USER="${SMOKE_USER:-admin}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-password}"

fail() {
  printf 'SMOKE FAIL: %s\n' "$1" >&2
  exit 1
}

check_status() {
  # check_status <method> <path> <expected> [data] [auth_header]
  method="$1"
  path="$2"
  expected="$3"
  data="${4:-}"
  auth="${5:-}"

  set -- -s -o /dev/null -w '%{http_code}' -X "$method" "${BASE_URL}${path}"
  if [ -n "$data" ]; then
    set -- "$@" -H 'content-type: application/json' -d "$data"
  fi
  if [ -n "$auth" ]; then
    set -- "$@" -H "authorization: Bearer ${auth}"
  fi

  code="$(curl "$@" || echo 000)"
  if [ "$code" != "$expected" ]; then
    fail "${method} ${path} returned ${code}, expected ${expected}"
  fi
  printf 'ok: %s %s -> %s\n' "$method" "$path" "$code"
}

printf 'Running smoke tests against %s\n' "$BASE_URL"

check_status GET / 200
check_status GET /health 200

# Auth flow: login should return a token, /me should accept it, logout should succeed.
login_body="$(curl -s -X POST "${BASE_URL}/login" \
  -H 'content-type: application/json' \
  -d "{\"username\":\"${SMOKE_USER}\",\"password\":\"${SMOKE_PASSWORD}\"}")"

token="$(printf '%s' "$login_body" | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[ -n "$token" ] || fail "login did not return a token (response: ${login_body})"
printf 'ok: POST /login -> token acquired\n'

check_status GET /me 200 '' "$token"
check_status POST /logout 200 '' "$token"

printf 'SMOKE PASS: all checks succeeded\n'
