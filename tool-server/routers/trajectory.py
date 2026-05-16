from fastapi import APIRouter, HTTPException
from models import TrajectoryUploadRequest
import phoenix_client as pc

router = APIRouter(prefix="/trajectory", tags=["trajectory"])

@router.post("/upload")
async def upload_trajectory(req: TrajectoryUploadRequest):
    """ATIF trajectory upload — evaluates the full agent run, not just spans."""
    try:
        result = await pc.upload_trajectory(
            project_name=req.project_name,
            session_id=req.session_id,
            steps=req.steps,
            expected_outcome=req.expected_outcome,
        )
        return {"uploaded": True, "trajectory_id": result.get("id")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cost-regression")
async def check_cost_regression(
    project_name: str,
    window_minutes: int = 60,
    threshold_pct: float = 20.0,
):
    """
    Checks token cost regression using new Phoenix REST token count fields.
    Compares current window avg tokens vs prior window.
    """
    try:
        recent = await pc.get_recent_traces(project_name, limit=100)

        def avg_tokens(traces):
            totals = [
                t.get("cumulative_token_count_total", 0)
                for t in traces
                if t.get("cumulative_token_count_total")
            ]
            return sum(totals) / len(totals) if totals else 0.0

        midpoint = len(recent) // 2
        current_window = recent[:midpoint]
        prior_window = recent[midpoint:]

        current_avg = avg_tokens(current_window)
        baseline_avg = avg_tokens(prior_window)

        regression_pct = (
            ((current_avg - baseline_avg) / max(baseline_avg, 1)) * 100
        )

        return {
            "project_name": project_name,
            "window_minutes": window_minutes,
            "current_avg_tokens": round(current_avg, 2),
            "baseline_avg_tokens": round(baseline_avg, 2),
            "regression_pct": round(regression_pct, 2),
            "flagged": regression_pct > threshold_pct,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
