async def http_request(url: str) -> str:
    """Perform approved HTTP requests once outbound tool policy is configured."""
    raise NotImplementedError(f"HTTP request tool is not configured for {url!r}.")
