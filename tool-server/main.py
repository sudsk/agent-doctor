import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openinference.instrumentation.mcp import MCPInstrumentor
from phoenix.otel import register

load_dotenv()

# Self-instrument the tool server — Agent Doctor's actions traced in Phoenix
tracer_provider = register(
    project_name="agent-doctor-self",
    endpoint=f"{os.environ['PHOENIX_BASE_URL']}/v1/traces",
    headers={"api_key": os.environ["PHOENIX_API_KEY"]},
)
MCPInstrumentor().instrument(tracer_provider=tracer_provider)

from routers import experiment, prompt, trajectory

app = FastAPI(
    title="Agent Doctor Tool Server",
    description="Custom tools extending Arize Phoenix MCP for Agent Doctor",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experiment.router)
app.include_router(prompt.router)
app.include_router(trajectory.router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "agent-doctor-tool-server"}

@app.get("/openapi-spec")
def openapi_spec():
    """Agent Builder reads this to register custom tools."""
    return app.openapi()
