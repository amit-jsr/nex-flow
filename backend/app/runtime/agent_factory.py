from app.models import Agent


def build_agent(agent: Agent) -> object:
    """Build a Strands agent from a stored agent record once providers are configured."""
    raise NotImplementedError(
        f"Strands runtime is not configured for saved agent {agent.id} yet."
    )
