"""
Resource tools — ADK-compatible functions used by the Resource Agent.

Each function is decorated as an ADK tool (M4) and called by the agent
during resource recommendation. For now they are stubs.
"""


async def search_resources(topic: str, level: str, resource_type: str = "all") -> list[dict]:
    """Return curated resources for a topic. Implemented in M4."""
    raise NotImplementedError("Implemented in M4")


async def rank_resources(resources: list[dict], goal: str) -> list[dict]:
    """Re-rank resources by relevance to the learner's goal. Implemented in M4."""
    raise NotImplementedError("Implemented in M4")
