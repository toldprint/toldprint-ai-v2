/* ============================================================
   TOLDPRINT™ — Semantic Index Loader (v1.2)
   Option B memory cache
   Loads semantic-index.json directly from Vercel Blob
   (no cross-domain HTTP calls)
============================================================ */

import { list } from "@vercel/blob";

const INDEX_BLOB = "semantic-index.json";

let SEMANTIC_INDEX_CACHE = null;
let SEMANTIC_INDEX_TIMESTAMP = 0;

// TTL 5 minutes
const TTL = 5 * 60 * 1000;

export async function loadSemanticIndex() {
  try {
    const now = Date.now();

    // Return cache if fresh
    if (SEMANTIC_INDEX_CACHE && (now - SEMANTIC_INDEX_TIMESTAMP) < TTL) {
      return SEMANTIC_INDEX_CACHE;
    }

    console.log("SemanticIndexLoader: reading from Blob…");

    const blobs = await list();
    const existing = blobs.blobs.find(b => b.pathname === INDEX_BLOB);

    if (!existing) {
      console.log("SemanticIndexLoader: no semantic-index.json in Blob");
      SEMANTIC_INDEX_CACHE = { collections: {}, products: {}, themes: {} };
      SEMANTIC_INDEX_TIMESTAMP = now;
      return SEMANTIC_INDEX_CACHE;
    }

    const res = await fetch(existing.url);
    const text = await res.text();
    const json = JSON.parse(text);

    SEMANTIC_INDEX_CACHE = json || { collections: {}, products: {}, themes: {} };
    SEMANTIC_INDEX_TIMESTAMP = now;

    console.log(
      "SemanticIndexLoader: loaded products =",
      Object.keys(SEMANTIC_INDEX_CACHE.products || {}).length
    );

    return SEMANTIC_INDEX_CACHE;

  } catch (err) {
    console.error("SemanticIndexLoader v1.2 Error:", err);
    return SEMANTIC_INDEX_CACHE || { collections: {}, products: {}, themes: {} };
  }
}

export function clearSemanticIndexCache() {
  SEMANTIC_INDEX_CACHE = null;
  SEMANTIC_INDEX_TIMESTAMP = 0;
}

