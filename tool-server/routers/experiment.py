import os, uuid
from fastapi import APIRouter, HTTPException
import vertexai
from vertexai.generative_models import GenerativeModel
from models import ExperimentRunRequest, ExperimentRunResponse
import phoenix_client as pc

router = APIRouter(prefix="/experiment", tags=["experiment"])

vertexai.init(
    project=os.environ["GCP_PROJECT_ID"],
    location=os.environ["VERTEX_AI_LOCATION"],
)

JUDGE_PROMPT = """You are an expert LLM evaluator.
Given a customer support ticket and a summary produced by an AI,
score the summary on three criteria, each 0.0–1.0:
- hallucination: 1.0 = no hallucinations, 0.0 = fabricated content
- relevance: 1.0 = fully addresses the ticket, 0.0 = off-topic
- conciseness: 1.0 = exactly 2 sentences, focused; 0.0 = verbose or padded

Respond ONLY as JSON: {{"hallucination": 0.0, "relevance": 0.0, "conciseness": 0.0}}

Ticket: {ticket}
Summary: {summary}"""

async def score_output(ticket: str, summary: str, model_name: str) -> dict:
    judge = GenerativeModel(model_name=model_name)
    response = judge.generate_content(
        JUDGE_PROMPT.format(ticket=ticket, summary=summary)
    )
    import json, re
    text = response.text
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        raise ValueError(f"Judge returned non-JSON: {text}")
    scores = json.loads(match.group())
    usage = response.usage_metadata
    return {
        "scores": scores,
        "prompt_tokens": usage.prompt_token_count,
        "completion_tokens": usage.candidates_token_count,
        "total_tokens": usage.total_token_count,
    }

@router.post("/run", response_model=ExperimentRunResponse)
async def run_experiment(req: ExperimentRunRequest):
    try:
        judge_model = os.environ.get("JUDGE_MODEL", "gemini-3-flash")
        experiment_id = str(uuid.uuid4())

        # Score current prompt
        current_scores, current_tokens = [], 0
        for inp in req.test_inputs if hasattr(req, 'test_inputs') else []:
            result = await score_output(inp, req.prompt_current, judge_model)
            current_scores.append(result["scores"])
            current_tokens += result["total_tokens"]

        # Score candidate prompt
        candidate_scores, candidate_tokens = [], 0
        for inp in req.test_inputs if hasattr(req, 'test_inputs') else []:
            result = await score_output(inp, req.prompt_candidate, judge_model)
            candidate_scores.append(result["scores"])
            candidate_tokens += result["total_tokens"]

        def avg(scores, key):
            return sum(s[key] for s in scores) / len(scores) if scores else 0.0

        current_overall = (
            avg(current_scores, "hallucination") +
            avg(current_scores, "relevance") +
            avg(current_scores, "conciseness")
        ) / 3

        candidate_overall = (
            avg(candidate_scores, "hallucination") +
            avg(candidate_scores, "relevance") +
            avg(candidate_scores, "conciseness")
        ) / 3

        cost_delta_pct = (
            ((candidate_tokens - current_tokens) / max(current_tokens, 1)) * 100
        )

        return ExperimentRunResponse(
            experiment_id=experiment_id,
            candidate_score=round(candidate_overall, 3),
            current_score=round(current_overall, 3),
            candidate_wins=candidate_overall > current_overall,
            cost_delta_pct=round(cost_delta_pct, 2),
            token_delta={
                "current": current_tokens,
                "candidate": candidate_tokens,
                "delta": candidate_tokens - current_tokens,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
