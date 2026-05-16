# Agent Doctor 🩺

**An autonomous LLM quality agent powered by Arize Phoenix + Google Cloud.**

Agent Doctor monitors your LLM applications through Phoenix traces, detects
quality and cost regressions, diagnoses root causes, proposes prompt fixes,
validates them via Phoenix Experiments, and promotes winning prompts —
closing the quality loop that every LLM team currently closes by hand.

Built for the [Google Cloud Rapid Agent Hackathon](https://rapid-agent.devpost.com/).

## Architecture

- **Orchestrator**: Google Cloud Agent Builder + Gemini 3.1 Pro (customtools)
- **Observability**: Arize Phoenix Cloud (MCP server v4.0.8)
- **Custom tools**: FastAPI on Cloud Run
- **UI**: React on Cloud Run / Firebase
- **Eval judge**: Gemini 3 Flash (LLM-as-judge)

## Arize Phoenix features used

- MCP server (traces, spans, prompts, experiments, datasets, sessions)
- Phoenix CLI (`px`) for agent-facing queries
- Session-level annotations
- Prompt version diff
- Token cost in REST (cost regression detection)
- ATIF trajectory upload (agent eval)
- `openinference-instrumentation-mcp` (recursive self-tracing)
- Filter-based annotation DELETE (lifecycle management)

## GCP features used

- Gemini Enterprise Agent Platform (Agent Builder)
- `gemini-3.1-pro-preview-customtools` orchestrator
- `gemini-3-flash` as eval judge
- Agent Registry (Phoenix MCP registered)
- Google-managed Cloud Logging MCP
- Cloud Run (tool server + UI)
- Model Armor (prompt injection protection)

## Quick start

```bash
cp .env.example .env
# Fill in your keys

# Seed Phoenix with demo data
python demo/seed_phoenix.py

# Run tool server locally
cd tool-server && uvicorn main:app --reload

# Run UI
cd ui && npm install && npm run dev

# Inject bad prompt to trigger Agent Doctor
python demo/inject_bad_prompt.py
```

## Licence

Apache 2.0
