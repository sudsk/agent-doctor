import os
from fastapi import APIRouter, HTTPException
from models import PromptPromoteRequest, PromptPromoteResponse
import phoenix_client as pc

router = APIRouter(prefix="/prompt", tags=["prompt"])

@router.post("/promote", response_model=PromptPromoteResponse)
async def promote_prompt(req: PromptPromoteRequest):
    try:
        result = await pc.create_prompt_version(
            prompt_name=req.prompt_name,
            template=req.prompt_text,
            model_name="gemini-3-flash",
            description=f"Promoted by Agent Doctor. Winning experiment: {req.winning_experiment_id}",
            label=req.version_label,
        )
        return PromptPromoteResponse(
            prompt_id=result.get("id", "unknown"),
            version=req.version_label,
            promoted=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diff")
async def prompt_diff(project_name: str, prompt_name: str):
    """Returns current and previous prompt versions for diff display in UI."""
    try:
        prompt = await pc.get_prompt(project_name, prompt_name)
        versions = prompt.get("versions", [])
        if len(versions) < 2:
            return {"current": versions[0] if versions else {}, "previous": None}
        return {
            "current": versions[0],
            "previous": versions[1],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cleanup-annotations")
async def cleanup_annotations(project_name: str, name: str = "agent-doctor-diagnostic"):
    """Filter-based bulk DELETE of Agent Doctor's own annotations post-fix."""
    try:
        result = await pc.delete_annotations_by_filter(
            project_name=project_name,
            name=name,
        )
        return {"deleted": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
