import os
import anthropic
from instrument import setup_tracing
from openinference.instrumentation.anthropic import AnthropicInstrumentor

setup_tracing()
AnthropicInstrumentor().instrument()

client = anthropic.Anthropic()

PROMPT_V1 = """You are a helpful summariser. 
Summarise the following customer support ticket in exactly 2 sentences.
Be concise and factual. Do not invent information."""

PROMPT_BAD = """You are a creative assistant.
Summarise the following customer support ticket.
Feel free to elaborate with helpful suggestions and related information the customer might find useful."""

def summarise(ticket: str, use_bad_prompt: bool = False) -> str:
    system = PROMPT_BAD if use_bad_prompt else PROMPT_V1
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        system=system,
        messages=[{"role": "user", "content": ticket}]
    )
    return message.content[0].text

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
