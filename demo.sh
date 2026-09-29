#!/usr/bin/env bash
# SecureMailScope — SIH demo launcher
# Starts backend + frontend, waits for health, then pre-loads every sample
# capture so no page is ever empty on stage.
#
#   ./demo.sh          start + warm (use this before you present)
#   ./demo.sh --reset  wipe the DB first, then start + warm
#   ./demo.sh --stop   stop both services
#
# Why the warm step exists: sessions are built in memory at ingest, so a
# backend restart empties previously-created reports. Warming after startup
# means a crash mid-demo is recoverable with ./demo.sh.

set -uo pipefail
cd "$(dirname "$0")"

API=http://127.0.0.1:8001
WEB=http://127.0.0.1:3000
SAMPLES=(stripped weak-cipher weak-key advertised-unused no-tls multihop)

c_dim=$'\033[2m'; c_ok=$'\033[32m'; c_bad=$'\033[31m'; c_hi=$'\033[1m'; c_0=$'\033[0m'

stop() {
  pkill -f "uvicorn backend.app.main" 2>/dev/null && echo "  stopped backend" || true
  pkill -f "next dev" 2>/dev/null && echo "  stopped frontend" || true
  lsof -ti:8001 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
}

if [[ "${1:-}" == "--stop" ]]; then stop; exit 0; fi

wait_for() { # url, label, tries
  local url=$1 label=$2 n=${3:-60}
  for ((i=1; i<=n; i++)); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "  ${c_ok}ready${c_0}  $label"; return 0
    fi
    sleep 1
  done
  echo "  ${c_bad}TIMEOUT${c_0}  $label — check the log above"; return 1
}

warm() {
  echo
  echo "${c_hi}Warming sample captures${c_0} ${c_dim}(so nothing on stage is empty)${c_0}"
  for s in "${SAMPLES[@]}"; do
    local body
    body=$(curl -fsS -X POST "$API/api/v1/captures/sample/$s" 2>/dev/null)
    if [[ -n $body ]]; then
      local idx grade
      idx=$(printf '%s' "$body" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("session_id",""))' 2>/dev/null)
      printf "  %s%-18s%s %s\n" "$c_dim" "$s" "$c_0" "$idx"
    else
      printf "  %s%-18s FAILED%s\n" "$c_bad" "$s" "$c_0"
    fi
  done
}

echo "${c_hi}Starting SecureMailScope${c_0}"
if [[ "${1:-}" == "--reset" ]]; then
  echo "  ${c_dim}resetting database${c_0}"
  python3 -c "
import sys; sys.path.insert(0,'.')
from app.db import get_db
db=get_db()
if db is not None:
    for c in ('sessions','findings','reports'):
        try: db[c].delete_many({})
        except Exception: pass
    print('  cleared')
" 2>/dev/null || echo "  ${c_dim}(no db to clear)${c_0}"
fi

echo "  ${c_dim}backend  -> :8001${c_0}"
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 > /tmp/sms-backend.log 2>&1 &
BACKEND_PID=$!

# NOTE: we deliberately use the PRODUCTION build, not `next dev`.
# Verified: under `next dev` the client never hydrates in this environment —
# pages render, but every button is inert, so the demo cannot be driven.
# `next start` hydrates correctly.
if [[ "${DEMO_DEV:-0}" == "1" ]]; then
  echo "  ${c_dim}frontend -> :3000 (dev mode — may be non-interactive)${c_0}"
  npm run dev:frontend > /tmp/sms-frontend.log 2>/dev/null &
else
  if [[ ! -d .next/BUILD_ID ]]; then
    echo "  ${c_dim}building production bundle (one time, ~20s)${c_0}"
    npm run build > /tmp/sms-build.log 2>&1 || { echo "  ${c_bad}build failed${c_0} - see /tmp/sms-build.log"; exit 1; }
  fi
  echo "  ${c_dim}frontend -> :3000 (production)${c_0}"
  npx next start -p 3000 > /tmp/sms-frontend.log 2>/dev/null &
fi
FRONTEND_PID=$!

trap 'echo; echo "  shutting down..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM

echo
wait_for "$API/api/v1/health" "backend"  || { tail -20 /tmp/sms-backend.log; exit 1; }
wait_for "$WEB"             "frontend" || { tail -20 /tmp/sms-frontend.log; exit 1; }

warm

cat <<EOF

${c_hi}Demo ready.${c_0}

  Dashboard   $WEB/dashboard
  Posture     $WEB/dashboard/posture
  Findings    $WEB/dashboard/findings
  Graph       $WEB/dashboard/graph
  Lens        $WEB/dashboard/lens
  Ask (RAG)   $WEB/dashboard/ask
  Integrity   $WEB/dashboard/integrity
  Replay      $WEB/dashboard/replay

  backend log  /tmp/sms-backend.log
  frontend log /tmp/sms-frontend.log
  stop         ./demo.sh --stop

${c_dim}If anything goes blank mid-demo, run ./demo.sh again — it rewarms everything.${c_0}
EOF
