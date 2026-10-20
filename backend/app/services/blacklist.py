import logging
import time
from typing import Optional

import redis.asyncio as aioredis
from redis.exceptions import ConnectionError, RedisError

from app.config import settings

logger = logging.getLogger("uvicorn.error")


class TokenBlacklistService:
    def __init__(self):
        self._redis_client: Optional[aioredis.Redis] = None
        self._redis_available: Optional[bool] = None
        # In-memory fallback cache: {jti: expiry_unix_timestamp}
        self._memory_blacklist: dict[str, float] = {}

    async def _get_redis(self) -> Optional[aioredis.Redis]:
        if self._redis_available is False:
            return None

        if self._redis_client is None:
            try:
                client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=1.0,
                    socket_timeout=1.0,
                )
                await client.ping()
                self._redis_client = client
                self._redis_available = True
                logger.info("Connected to Redis token blacklist.")
            except (ConnectionError, RedisError, Exception) as exc:
                self._redis_available = False
                logger.warning(
                    f"Redis unavailable ({exc}). Using in-memory token blacklist fallback."
                )
                return None

        return self._redis_client

    def _cleanup_memory(self):
        now = time.time()
        expired = [jti for jti, exp in self._memory_blacklist.items() if exp < now]
        for jti in expired:
            self._memory_blacklist.pop(jti, None)

    async def revoke_token(self, jti: str, expires_in_seconds: int) -> bool:
        if not jti:
            return False

        ttl = max(1, int(expires_in_seconds))
        # Always store in memory fallback
        self._memory_blacklist[jti] = time.time() + ttl
        self._cleanup_memory()

        client = await self._get_redis()
        if client:
            try:
                await client.setex(f"blacklist:{jti}", ttl, "revoked")
                return True
            except (ConnectionError, RedisError) as exc:
                logger.warning(f"Failed to blacklist token in Redis: {exc}. Stored in-memory.")
                return True

        return True

    async def is_token_revoked(self, jti: str) -> bool:
        if not jti:
            return False

        # Check in-memory store
        now = time.time()
        exp = self._memory_blacklist.get(jti)
        if exp is not None:
            if exp >= now:
                return True
            else:
                self._memory_blacklist.pop(jti, None)

        client = await self._get_redis()
        if client:
            try:
                exists = await client.exists(f"blacklist:{jti}")
                return bool(exists)
            except (ConnectionError, RedisError):
                return False

        return False

    async def close(self):
        if self._redis_client:
            try:
                await self._redis_client.close()
            except Exception:
                pass


token_blacklist = TokenBlacklistService()
