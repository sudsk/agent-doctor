# GCP Features Used

| Feature | How used |
|---------|----------|
| Gemini Enterprise Agent Platform | Orchestration platform (fka Vertex AI) |
| Agent Builder | Front-door orchestrator per hackathon requirement |
| `gemini-3.1-pro-preview-customtools` | Orchestrator — purpose-built for agents with custom tools |
| `gemini-3-flash` | LLM-as-judge for eval scoring in /experiment/run |
| Agent Registry | Phoenix MCP server registered + governed here |
| Google-managed Cloud Logging MCP | Dual observability signal alongside Phoenix |
| Cloud Run (tool server) | FastAPI custom tool server, gen2, autoscaling |
| Cloud Run (UI) | React demo UI |
| Model Armor | Prompt injection protection on MCP calls |
| Secret Manager | API keys for Cloud Run services |
| Cloud Build | CI/CD pipeline for tool server + UI |
| Vertex AI OTel | Traces from Agent Doctor flow to Cloud Trace |
| Application Default Credentials | Auth for Gemini calls — no key management |
