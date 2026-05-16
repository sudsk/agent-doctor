"""
Local runner for Agent Doctor — useful for testing outside Agent Builder.
In production, Agent Builder hosts the agent and calls Gemini directly.
"""
import os
import vertexai
from vertexai.preview import reasoning_engines
from dotenv import load_dotenv

load_dotenv()

vertexai.init(
    project=os.environ["GCP_PROJECT_ID"],
    location=os.environ["VERTEX_AI_LOCATION"],
)

def build_agent():
    from vertexai.preview.reasoning_engines import AdkApp
    from google.adk.agents import LlmAgent
    from google.adk.tools.mcp_tool import MCPToolset, SseServerParams

    phoenix_mcp = MCPToolset(
        connection_params=SseServerParams(
            url="https://app.phoenix.arize.com/mcp",
            headers={"api_key": os.environ["PHOENIX_API_KEY"]},
        )
    )

    with open("agent/system_prompt.txt") as f:
        system_prompt = f.read()

    agent = LlmAgent(
        model=os.environ.get("ORCHESTRATOR_MODEL", "gemini-3.1-pro-preview-customtools"),
        name="agent_doctor",
        description="Autonomous LLM quality assurance agent using Arize Phoenix",
        instruction=system_prompt,
        tools=[phoenix_mcp],
    )
    return agent

def run_local(user_message: str):
    agent = build_agent()
    response = agent.run(user_message)
    print(response)

if __name__ == "__main__":
    run_l
