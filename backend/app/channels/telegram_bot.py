async def dispatch_telegram_update(update_id: int | None) -> None:
    """Dispatch Telegram work after bot credentials and runtime are configured."""
    raise NotImplementedError(f"Telegram dispatch is not configured for update {update_id}.")
