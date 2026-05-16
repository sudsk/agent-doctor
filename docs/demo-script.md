# Agent Doctor — 3-Minute Demo Script

## Setup (before recording)

1. `cp .env.example .env` — fill in Phoenix API key + GCP project
2. `python demo/seed_phoenix.py` — creates dataset + v1 prompt in Phoenix
3. `python demo/target_agent/target_agent.py` — generates clean baseline traces
4. Start tool server: `cd tool-server && uvicorn main:app --reload`
5. Start UI: `cd ui && npm start`
6. Open UI at http://localhost:3000
7. Open Phoenix at https://app.phoenix.arize.com — have project tab ready

## Demo arc (3 minutes)

### 00:00 — 00:30 · Setup and context

Show the UI — four panels visible:
- Top left: token cost trend (flat, green)
- Bottom left: Phoenix trace list (all green, passing)  
- Centre: agent reasoning log (shows "Monitoring...")
- Right: prompt diff (empty), approve button (inactive)

Say:
> "This is Agent Doctor — an autonomous LLM quality agent
> built on Arize Phoenix and Google Cloud. It monitors LLM
> applications and closes the quality loop that every team
> currently closes by hand."

### 00:30 — 01:00 · Inject regression

Run in terminal (visible to camera):
```bash
python demo/inject_bad_prompt.py
```

Watch the UI:
- Trace panel turns red — failing scores appear
- Cost chart spikes upward
- Status badge flips to "Regression!"
- Agent log begins streaming diagnosis steps

Say:
> "Someone shipped a bad prompt version — the summariser is
> now hallucinating and using 2x the tokens. Agent Doctor
> detects this automatically from Phoenix traces."

### 01:00 — 01:45 · Diagnosis + proposal

Agent log completes. Point to:
- Diagnosis panel: hypothesis visible
- Prompt diff: red lines (removed constraints), green lines (fix)

Say:
> "Agent Doctor pulled the failing spans, retrieved the prompt
> diff from Phoenix, and formed a hypothesis. It's identified
> the exact change that caused the regression and proposed a
> minimal fix. Now it needs my approval to validate."

### 01:45 — 02:15 · Validate

Click "Validate candidate against dataset".

Experiment runs — Gemini Flash judges both prompts against
the Phoenix dataset. Results appear:
- Current: 0.61 · Candidate: 0.91
- Cost delta: -18% (cheaper AND better)

Say:
> "The experiment runs on the Phoenix dataset using Gemini
> as judge. The candidate prompt scores 0.91 vs 0.61, and
> it's actually 18% cheaper. Agent Doctor recommends promotion."

### 02:15 — 02:45 · Promote

Click "Approve promotion".

Watch:
- Tool server calls /prompt/promote → Phoenix gets new version
- Diagnostic annotations cleaned up (filter-based DELETE)
- Final audit annotation written to session
- Status badge flips to "Healthy ✓"

Say:
> "One click — the winning prompt is promoted to Phoenix,
> diagnostic annotations are cleaned up, and an audit trail
> is written. The quality loop is closed."

### 02:45 — 03:00 · Show Phoenix

Switch to Phoenix tab. Show:
- New prompt version in Prompt Management
- Session annotation with full audit trail
- Experiment results
- Clean trace list (monitoring resumed)

Say:
> "Everything is recorded in Phoenix — the diagnosis, the
> experiment, the promotion. Full auditability. Agent Doctor
> is now resuming monitoring autonomously."

## Key talking points for judges

- Phoenix is **load-bearing**, not decorative — every phase
  depends on a different Phoenix feature
- Agent Doctor closes the loop Arize's own blog describes
  as their product vision
- Human-in-the-loop is deliberate — approval required for
  promotion and annotation deletion
- Self-tracing via openinference-instrumentation-mcp means
  Agent Doctor's own actions are observable in Phoenix
- Full GCP-native stack — Agent Registry, Model Armor,
  Gemini 3.1 Pro customtools, Cloud Run
