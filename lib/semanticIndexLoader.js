/* ============================================================
   TOLDPRINT™ — Semantic Index Loader (v1.3)
   Option B memory cache + TTL
   Reads LATEST semantic-index*.json from Vercel Blob
============================================================ */

import { list } from "@vercel/blob";

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

    console.log("SemanticIndexLoader v1.3: listing blobs…");

    const blobs = await list();

    // 1) Get all semantic-index*.json blobs
    const candidates = (blobs?.blobs || []).filter(b =>
      b.pathname?.startsWith("semantic-index") &&
      b.pathname?.endsWith(".json")
    );

    if (!candidates.length) {
      console.log("SemanticIndexLoader v1.3: no semantic-index blobs found");
      SEMANTIC_INDEX_CACHE = { collections: {}, products: {}, themes: {} };
      SEMANTIC_INDEX_TIMESTAMP = now;
      return SEMANTIC_INDEX_CACHE;
    }

    // 2) Prefer latest by uploadedAt if present, else fallback to lexical
    candidates.sort((a, b) => {
      const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      if (ta !== tb) return tb - ta;
      return (b.pathname || "").localeCompare(a.pathname || "");
    });

    const latest = candidates[0];

    console.log("SemanticIndexLoader v1.3: loading", latest.pathname);

    const res = await fetch(latest.url);
    const text = await res.text();
    const json = JSON.parse(text);

    SEMANTIC_INDEX_CACHE = json || { collections: {}, products: {}, themes: {} };
    SEMANTIC_INDEX_TIMESTAMP = now;

    console.log(
      "SemanticIndexLoader v1.3: loaded products =",
      Object.keys(SEMANTIC_INDEX_CACHE.products || {}).length
    );

    return SEMANTIC_INDEX_CACHE;

  } catch (err) {
    console.error("SemanticIndexLoader v1.3 Error:", err);
    return SEMANTIC_INDEX_CACHE || { collections: {}, products: {}, themes: {} };
  }
}

export function clearSemanticIndexCache() {
  SEMANTIC_INDEX_CACHE = null;
  SEMANTIC_INDEX_TIMESTAMP = 0;
}

