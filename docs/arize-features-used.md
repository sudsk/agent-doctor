# Arize Phoenix Features Used

Every feature below is load-bearing — Agent Doctor cannot
function without it.

| Feature | Version | How used |
|---------|---------|----------|
| MCP Server | v4.0.8 | Primary agent superpowers — all Phoenix data access |
| Traces + Spans REST | v14.x | DETECT phase — pull failing spans for diagnosis |
| Token count REST fields | v14.x | Cost regression: `cumulative_token_count_total` |
| Session annotations | v14.x | DIAGNOSE — write hypothesis to failing session |
| Span annotations | v14.x | Tag individual failing spans with diagnostic label |
| Filter-based annotation DELETE | v14.x | PROMOTE — clean up diagnostic annotations post-fix |
| Prompt versioning | v14.x | PROPOSE — read current prompt version |
| Prompt version diff | v14.x | PROPOSE — show before/after diff in UI |
| Prompt create/update | v14.x | PROMOTE — write winning candidate as new version |
| Datasets | v14.x | VALIDATE — run experiment against seeded dataset |
| Experiments | v14.x | VALIDATE — compare candidate vs current |
| ATIF trajectory upload | v14.x | Eval full agent trajectory not just spans |
| Sessions API | v13.12+ | Session retrieval for annotation targeting |
| Phoenix CLI (px) | v0.8+ | Agent-facing terminal queries for traces/experiments |
| `openinference-instrumentation-mcp` | v0.1.0 | Self-tracing — Agent Doctor's own calls traced |
| Phoenix Cloud free tier | — | Zero-cost hosting for demo |
