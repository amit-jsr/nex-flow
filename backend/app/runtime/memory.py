class RedisSessionManager:
    """Placeholder for Redis-backed agent session state."""

    async def load(self, session_id: str) -> list[dict[str, str]]:
        raise NotImplementedError(f"Redis memory is not configured for session {session_id}.")

    async def save(self, session_id: str, messages: list[dict[str, str]]) -> None:
        raise NotImplementedError(f"Redis memory is not configured for session {session_id}.")
