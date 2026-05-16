from pydantic import BaseModel
from typing import Optional, List

class ExperimentRunRequest(BaseModel):
    project_name: str
    dataset_id: str
    prompt_candidate: str
    prompt_current: str
    model_name: str = "gemini-3-flash"
    experiment_name: Optional[str] = None

class ExperimentRunResponse(BaseModel):
    experiment_id: str
    candidate_score: float
    current_score: float
    candidate_wins: bool
    cost_delta_pct: float
    token_delta: dict

class PromptScoreRequest(BaseModel):
    prompt_text: str
    test_inputs: List[str]
    model_name: str = "gemini-3-flash"

class PromptScoreResponse(BaseModel):
    hallucination_score: float
    relevance_score: float
    conciseness_score: float
    overall: float
    token_total: int
    cost_usd: float

class PromptPromoteRequest(BaseModel):
    project_name: str
    prompt_name: str
    prompt_text: str
    winning_experiment_id: str
    version_label: str = "agent-doctor-promoted"

class PromptPromoteResponse(BaseModel):
    prompt_id: str
    version: str
    promoted: bool

class TrajectoryUploadRequest(BaseModel):
    project_name: str
    session_id: str
    steps: List[dict]
    expected_outcome: Optional[str] = None

class AnnotationCleanupRequest(BaseModel):
    project_name: str
    annotator_kind: str = "LLM"
    name: str = "agent-doctor-diagnostic"

class CostRegressionResult(BaseModel):
    project_name: str
    window_minutes: int = 60
    current_avg_tokens: float
    baseline_avg_tokens: float
    regression_pct: float
    flagged: bool
