"""Injects a hallucination-prone prompt version and runs the target agent.
This triggers Agent Doctor's detection loop."""
import os, subprocess

print("Injecting bad prompt version into target agent...")
env = os.environ.copy()
env["USE_BAD_PROMPT"] = "true"

subprocess.run(
    ["python", "demo/target_agent/target_agent.py"],
    env=env
)
print("Bad traces generated. Agent Doctor should detect regression shortly.")
