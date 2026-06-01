"""Shared FastAPI dependency helpers for database access and request wiring."""

from datastore.database import get_db

__all__ = ["get_db"]
