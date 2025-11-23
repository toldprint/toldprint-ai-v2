/* ============================================================
   TOLDPRINT™ — Semantic Index Loader (v1.1)
   Option B with safe TTL refresh (fast + always up to date)
============================================================ */

let SEMANTIC_INDEX_CACHE = null;
let SEMANTIC_INDEX_TIMESTAMP = 0;

// TTL in ms (5 minutes)
const TTL = 5 * 60 * 1000;

export async function loadSemanticIndex() {
  try {
    const now = Date.now();

    // If cache exists and is fresh → return it
    if (SEMANTIC_INDEX_CACHE && (now - SEMANTIC_INDEX_TIMESTAMP) < TTL) {
      return SEMANTIC_INDEX_CACHE;
    }

    console.log("Refreshing semantic-index.json from Blob…");

    const base =
      process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "https://toldprint-ai-v2.vercel.app";

    const res = await fetch(`${base}/api/semantic-index`);

    if (!res.ok) {
      console.error("Failed to fetch semantic-index:", res.status);
      return SEMANTIC_INDEX_CACHE || { collections:{}, products:{}, themes:{} };
    }

    const data = await res.json();
    const index = data?.semanticIndex || { collections:{}, products:{}, themes:{} };

    SEMANTIC_INDEX_CACHE = index;
    SEMANTIC_INDEX_TIMESTAMP = now;

    console.log(`Semantic index ready: ${Object.keys(index.products||{}).length} products`);
    return index;

  } catch (err) {
    console.error("SemanticIndexLoader Error:", err);
    return SEMANTIC_INDEX_CACHE || { collections:{}, products:{}, themes:{} };
  }
}

export function clearSemanticIndexCache() {
  SEMANTIC_INDEX_CACHE = null;
  SEMANTIC_INDEX_TIMESTAMP = 0;
}

