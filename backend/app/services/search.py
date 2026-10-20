import logging
import re
from typing import Optional

from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger("uvicorn.error")


class SearchService:
    def __init__(self):
        self._meili_available: Optional[bool] = None

    async def _check_meili(self) -> bool:
        if not settings.MEILISEARCH_URL:
            return False

        if self._meili_available is not None:
            return self._meili_available

        try:
            async with AsyncClient(timeout=1.5) as client:
                headers = {}
                if settings.MEILISEARCH_KEY:
                    headers["Authorization"] = f"Bearer {settings.MEILISEARCH_KEY}"
                res = await client.get(f"{settings.MEILISEARCH_URL.rstrip('/')}/health", headers=headers)
                if res.status_code == 200:
                    self._meili_available = True
                    logger.info("Connected to Meilisearch engine.")
                    return True
        except Exception:
            pass

        self._meili_available = False
        return False

    async def search_product_ids(
        self, db: AsyncSession, search_term: str, limit: int = 50
    ) -> list[int]:
        """Search products using Meilisearch if enabled, or MySQL FULLTEXT search with fallback.

        Returns a list of product IDs ordered by relevance.
        """
        clean_query = search_term.strip()
        if not clean_query:
            return []

        # 1. Try Meilisearch if configured & available
        if await self._check_meili():
            try:
                async with AsyncClient(timeout=2.0) as client:
                    headers = {"Content-Type": "application/json"}
                    if settings.MEILISEARCH_KEY:
                        headers["Authorization"] = f"Bearer {settings.MEILISEARCH_KEY}"
                    res = await client.post(
                        f"{settings.MEILISEARCH_URL.rstrip('/')}/indexes/products/search",
                        headers=headers,
                        json={"q": clean_query, "limit": limit},
                    )
                    if res.status_code == 200:
                        hits = res.json().get("hits", [])
                        return [int(hit["id"]) for hit in hits if "id" in hit]
            except Exception as e:
                logger.warning(f"Meilisearch search error: {e}. Falling back to MySQL FULLTEXT.")

        # 2. MySQL FULLTEXT search with boolean mode prefix matching
        words = re.findall(r"\w+", clean_query)
        if not words:
            return []

        # Construct boolean mode query: e.g. "+hair* +oil*"
        boolean_terms = " ".join(f"+{w}*" for w in words)

        try:
            sql = text("""
                SELECT id,
                    MATCH(name, tagline, description, ingredients) AGAINST (:term IN BOOLEAN MODE) as score
                FROM products
                WHERE MATCH(name, tagline, description, ingredients) AGAINST (:term IN BOOLEAN MODE)
                ORDER BY score DESC
                LIMIT :limit
            """)
            result = await db.execute(sql, {"term": boolean_terms, "limit": limit})
            rows = result.fetchall()
            if rows:
                return [int(r[0]) for r in rows]
        except Exception as exc:
            logger.warning(f"MySQL FULLTEXT search encountered issue: {exc}. Falling back to LIKE.")

        # 3. Fallback for terms shorter than fulltext min-token length or unindexed tokens
        like_clauses = []
        params = {"limit": limit}
        for idx, w in enumerate(words):
            param_name = f"w_{idx}"
            like_clauses.append(
                f"(name LIKE :{param_name} OR tagline LIKE :{param_name} OR description LIKE :{param_name})"
            )
            params[param_name] = f"%{w}%"

        where_clause = " OR ".join(like_clauses)
        sql = text(f"SELECT id FROM products WHERE {where_clause} LIMIT :limit")
        result = await db.execute(sql, params)
        return [int(r[0]) for r in result.fetchall()]

    async def sync_product(self, product_data: dict):
        """Index or update product in Meilisearch asynchronously if available."""
        if not await self._check_meili():
            return

        try:
            async with AsyncClient(timeout=2.0) as client:
                headers = {"Content-Type": "application/json"}
                if settings.MEILISEARCH_KEY:
                    headers["Authorization"] = f"Bearer {settings.MEILISEARCH_KEY}"
                await client.post(
                    f"{settings.MEILISEARCH_URL.rstrip('/')}/indexes/products/documents",
                    headers=headers,
                    json=[product_data],
                )
        except Exception as e:
            logger.warning(f"Failed to sync product to Meilisearch: {e}")

    async def delete_product(self, product_id: int):
        """Delete product from Meilisearch asynchronously if available."""
        if not await self._check_meili():
            return

        try:
            async with AsyncClient(timeout=2.0) as client:
                headers = {}
                if settings.MEILISEARCH_KEY:
                    headers["Authorization"] = f"Bearer {settings.MEILISEARCH_KEY}"
                await client.delete(
                    f"{settings.MEILISEARCH_URL.rstrip('/')}/indexes/products/documents/{product_id}",
                    headers=headers,
                )
        except Exception as e:
            logger.warning(f"Failed to delete product from Meilisearch: {e}")


search_service = SearchService()
