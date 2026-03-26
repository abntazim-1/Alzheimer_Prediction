import pytest
from httpx import AsyncClient, ASGITransport
from app import app
import os

@pytest.mark.asyncio
async def test_read_main():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        assert app is not None

@pytest.mark.asyncio
async def test_chat_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Simple test to verify the app can be loaded
        pass
