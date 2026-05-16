import os
import vertexai
from vertexai.generative_models import GenerativeModel, Content, Part
from instrument import setup_tracing
from openinference.instrumentation.vertexai import VertexAIInstrumentor

vertexai.init(
    project=os.environ["GCP_PROJECT_ID"],
    location=os.environ["VERTEX_AI_LOCATION"],
)
setup_tracing()
VertexAIInstrumentor().instrument()

PROMPT_V1 = """You are a helpful summariser.
Summarise the following customer support ticket in exactly 2 sentences.
Be concise and factual. Do not invent information."""

PROMPT_BAD = """You are a creative assistant.
Summarise the following customer support ticket.
Feel free to elaborate with helpful suggestions and related information the customer might find useful."""

def summarise(ticket: str, use_bad_prompt: bool = False) -> str:
    system = PROMPT_BAD if use_bad_prompt else PROMPT_V1
    model = GenerativeModel(
        model_name="gemini-3-flash",
        system_instruction=system,
    )
    response = model.generate_content(ticket)
    return response.text

if __name__ == "__main__":
    tickets = [
        "My order #12345 hasn't arrived after 3 weeks. I need a refund.",
        "The app crashes every time I try to upload a photo. iOS 17.",
        "I was charged twice for my subscription this month.",
    ]
    use_bad = os.environ.get("USE_BAD_PROMPT", "false").lower() == "true"
    for t in tickets:
        result = summarise(t, use_bad_prompt=use_bad)
        print(f"Input: {t[:60]}...")
        print(f"Output: {result}\n")
