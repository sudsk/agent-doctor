import os
from phoenix.otel import register
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_tracing(project_name: str = "agent-doctor-demo"):
    tracer_provider = register(
        project_name=project_name,
        endpoint=f"{os.environ['PHOENIX_BASE_URL']}/v1/traces",
        headers={"api_key": os.environ["PHOENIX_API_KEY"]},
    )
    return tracer_provider
