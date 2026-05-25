"""
Application entry point.

Run: uvicorn main:app --reload --port 8000
"""
from server_improved import app  # noqa: F401

__all__ = ["app"]
