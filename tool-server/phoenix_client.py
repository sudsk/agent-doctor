import os, httpx
from typing import Optional

PHOENIX_BASE_URL = os.environ["PHOENIX_BASE_URL"]
PHOENIX_API_KEY = os.environ["PHOENIX_API_KEY"]

def headers():
    return {
        "api_key": PHOENIX_API_KEY,
        "Content-Type": "application/json",
    }

async def get_recent_traces(project_name: str, limit: int = 50) -> list:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{PHOENIX_BASE_URL}/v1/projects/{project_name}/traces",
            headers=headers(),
            params={"limit": limit},
        )
        r.raise_for_status()
        data = r.json()
        # Extract token counts from REST (new Phoenix feature)
        traces = data.get("data", [])
        return traces

async def get_span_details(project_name: str, span_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{PHOENIX_BASE_URL}/v1/projects/{project_name}/spans/{span_id}",
            headers=headers(),
        )
        r.raise_for_status()
        return r.json()

async def create_session_annotation(
    project_name: str,
    session_id: str,
    label: str,
    score: float,
    explanation: str,
    annotator_kind: str = "LLM",
    name: str = "agent-doctor-diagnostic",
):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{PHOENIX_BASE_URL}/v1/projects/{project_name}/session_annotations",
            headers=headers(),
            json={
                "session_id": session_id,
                "name": name,
                "annotator_kind": annotator_kind,
                "label": label,
                "score": score,
                "explanation": explanation,
            },
        )
        r.raise_for_status()
        return r.json()

async def delete_annotations_by_filter(
    project_name: str,
    name: str,
    annotator_kind: str = "LLM",
):
    """Filter-based bulk annotation DELETE — new Phoenix feature."""
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f"{PHOENIX_BASE_URL}/v1/projects/{project_name}/span_annotations",
            headers=headers(),
            params={"name": name, "annotator_kind": annotator_kind},
        )
        r.raise_for_status()
        return r.json()

async def upload_trajectory(
    project_name: str,
    session_id: str,
    steps: list,
    expected_outcome: Optional[str] = None,
):
    """ATIF trajectory upload — evaluates multi-step agent runs."""
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{PHOENIX_BASE_URL}/v1/projects/{project_name}/trajectories",
            headers=headers(),
            json={
                "session_id": session_id,
                "steps": steps,
                "expected_outcome": expected_outcome,
            },
        )
        r.raise_for_status()
        return r.json()

async def get_prompt(project_name: str, prompt_name: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{PHOENIX_BASE_URL}/v1/prompts",
            headers=headers(),
            params={"project_name": project_name, "name": prompt_name},
        )
        r.raise_for_status()
        data = r.json()
        return data.get("data", [{}])[0]

async def create_prompt_version(
    prompt_name: str,
    template: str,
    model_name: str,
    description: str,
    label: str,
) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{PHOENIX_BASE_URL}/v1/prompts",
            headers=headers(),
            json={
                "name": prompt_name,
                "template": template,
                "model_name": model_name,
                "model_provider": "GOOGLE",
                "description": description,
                "tags": [label],
            },
        )
        r.raise_for_status()
        return r.json()
