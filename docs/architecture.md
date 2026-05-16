# Agent Doctor — Architecture

## Overview

Agent Doctor is an autonomous LLM quality assurance agent that monitors
LLM applications via Arize Phoenix, detects regressions, diagnoses root
causes, validates fixes experimentally, and promotes winning prompts —
all with a human-in-the-loop approval gate.

## Component diagram
┌────────────────────────────────────────────────────────────┐
│                    Google Cloud                            │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Gemini Enterprise Agent Platform            │   │
│  │                                                     │   │
│  │   Agent Builder                                     │   │
│  │   model: gemini-3.1-pro-preview-customtools         │   │
│  │   ┌──────────────────┐  ┌────────────────────────┐  │   │
│  │   │ Phoenix MCP      │  │ Custom Tool Server     │  │   │
│  │   │ (Arize)          │  │ (Cloud Run / FastAPI)  │  │   │
│  │   │ traces · spans   │  │ /experiment/run        │  │   │
│  │   │ prompts · evals  │  │ /prompt/promote        │  │   │
│  │   │ sessions · annot │  │ /prompt/diff           │  │   │
│  │   │ datasets · expts │  │ /trajectory/upload     │  │   │
│  │   └──────────────────┘  │ /trajectory/cost-reg   │  │   │
│  │                         └────────────────────────┘  │   │
│  │   Agent Registry                                    │   │
│  │   (Phoenix MCP registered + governed)               │   │
│  │                                                     │   │
│  │   Model Armor                                       │   │
│  │   (prompt injection protection on MCP calls)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │ React UI         │    │ Gemini Flash                 │  │
│  │ (Cloud Run)      │    │ (LLM-as-judge eval scoring)  │  │
│  │ Trace panel      │    └──────────────────────────────┘  │
│  │ Diagnosis stream │                                      │
│  │ Prompt diff      │    ┌──────────────────────────────┐  │
│  │ Approve button   │    │ Cloud Logging MCP            │  │
│  └──────────────────┘    │ (dual observability signal)  │  │
│                          └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
│
▼
┌───────────────────────────────┐
│     Arize Phoenix Cloud       │
│   app.phoenix.arize.com       │
│                               │
│   Projects · Traces · Spans   │
│   Prompts (versioned + diff)  │
│   Datasets · Experiments      │
│   Sessions · Annotations      │
│   ATIF Trajectories           │
│   Token cost REST fields      │
│   CLI (px)                    │
│   MCP Server v4.0.8           │
└───────────────────────────────┘
│
▼
┌───────────────────────────────┐
│     Target Agent (patient)    │
│   gemini-3-flash              │
│   OpenInference instrumented  │
│   Traces → Phoenix via OTel   │
└───────────────────────────────┘

## Data flow

1. Target agent runs, emits OTel traces to Phoenix via OpenInference
2. Agent Doctor polls Phoenix MCP for trace eval scores + token counts
3. Regression detected → spans pulled, prompt diff retrieved
4. Hypothesis formed → diagnostic annotation written to Phoenix session
5. Candidate prompt drafted → validated via /experiment/run (Gemini judge)
6. User approves → /prompt/promote writes new version to Phoenix
7. /prompt/cleanup-annotations bulk-deletes diagnostic annotations
8. Final audit annotation written → monitoring resumes

## Self-tracing

Agent Doctor instruments its own MCP calls via
`openinference-instrumentation-mcp`, so its own actions are
traced in Phoenix project `agent-doctor-self`. The agent that
monitors agents is itself monitored.
