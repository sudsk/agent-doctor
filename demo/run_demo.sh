#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# Agent Doctor — Demo Runner
# Executes the full 3-minute demo arc deterministically
# ═══════════════════════════════════════════════════════════════

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[demo]${NC} $1"; }
ok()   { echo -e "${GREEN}[ok]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
fail() { echo -e "${RED}[fail]${NC} $1"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────
log "Checking environment..."
[ -z "$PHOENIX_API_KEY" ]  && fail "PHOENIX_API_KEY not set"
[ -z "$GCP_PROJECT_ID" ]   && fail "GCP_PROJECT_ID not set"
[ -z "$TOOL_SERVER_URL" ]  && fail "TOOL_SERVER_URL not set"
ok "Environment ready"

# ── Step 1: Seed Phoenix ──────────────────────────────────────
log "Step 1/5 — Seeding Phoenix with dataset and baseline prompt..."
python demo/seed_phoenix.py
ok "Phoenix seeded"

# ── Step 2: Generate clean baseline traces ────────────────────
log "Step 2/5 — Running target agent with GOOD prompt (baseline traces)..."
python demo/target_agent/target_agent.py
ok "Baseline traces written to Phoenix"

sleep 2

# ── Step 3: Inject bad prompt ─────────────────────────────────
log "Step 3/5 — Injecting bad prompt version (simulating regression)..."
python demo/inject_bad_prompt.py
ok "Regression traces written to Phoenix"

sleep 2

# ── Step 4: Check cost regression endpoint ────────────────────
log "Step 4/5 — Checking cost regression via tool server..."
COST=$(curl -s "${TOOL_SERVER_URL}/trajectory/cost-regression?project_name=agent-doctor-demo")
echo "$COST" | python -m json.tool
FLAGGED=$(echo "$COST" | python -c "import sys,json; print(json.load(sys.stdin)['flagged'])")
if [ "$FLAGGED" = "True" ]; then
  warn "Cost regression FLAGGED — Agent Doctor will detect this"
else
  ok "Cost within baseline (may need more traces)"
fi

# ── Step 5: Open UI ───────────────────────────────────────────
log "Step 5/5 — Opening Agent Doctor UI..."
UI
