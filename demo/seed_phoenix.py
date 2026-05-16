"""Seeds Phoenix with a project, dataset, and clean baseline traces."""
import os, json
import phoenix as px
from phoenix.client import Client

client = Client(
    base_url=os.environ["PHOENIX_BASE_URL"],
    api_key=os.environ["PHOENIX_API_KEY"],
)

TICKETS = [
    {"ticket": "My order #12345 hasn't arrived after 3 weeks. I need a refund."},
    {"ticket": "The app crashes every time I try to upload a photo. iOS 17."},
    {"ticket": "I was charged twice for my subscription this month."},
    {"ticket": "Password reset email never arrives despite multiple attempts."},
    {"ticket": "Product arrived damaged. Box was crushed. Need replacement."},
]

def seed():
    # Create dataset
    dataset = client.datasets.create(
        name="support-ticket-summarisation",
        description="Customer support tickets for summarisation evaluation",
        inputs=[{"ticket": t["ticket"]} for t in TICKETS],
    )
    print(f"Created dataset: {dataset.id}")

    # Create initial prompt version
    prompt = client.prompts.create(
        name="support-summariser",
        template="You are a helpful summariser. Summarise the following customer support ticket in exactly 2 sentences. Be concise and factual. Do not invent information.\n\nTicket: {{ticket}}",
        model_name="gemini-3-flash",
        model_provider="GOOGLE",
        description="v1 — baseline concise summariser",
    )
    print(f"Created prompt: {prompt.id}")
    print("Seeding complete. Run target_agent.py to generate baseline traces.")

if __name__ == "__main__":
    seed()
