/* ============================================================
   TOLDPRINT™ — Semantic Index Loader (v1.0)
   Loads semantic-index.json ONCE per Vercel instance (Option B)
   Uses in-memory cache for maximum speed.
   Compatible with /api/semantic-index.js Blob endpoint.
============================================================ */

let SEMANTIC_INDEX_CACHE = null;    // memory cache
let SEMANTIC_INDEX_TIMESTAMP = null;

/* ------------------------------------------------------------
   Load semantic index from Blob (via /api/semantic-index GET)
------------------------------------------------------------- */
export async function loadSemanticIndex() {
  try {
    // If already loaded → return cache
    if (SEMANTIC_INDEX_CACHE) {
      return SEMANTIC_INDEX_CACHE;
    }

    console.log("Loading semantic-index.json from Blob…");

    const res = await fetch(
      `${process.env.VERCEL_URL 
          ? "https://" + process.env.VERCEL_URL 
          : "https://toldprint-ai-v2.vercel.app"
      }/api/semantic-index`
    );

    if (!res.ok) {
      console.error("Failed to fetch semantic-index:", res.status);
      return { collections: {}, products: {}, themes: {} };
    }

    const data = await res.json();
    const index = data?.semanticIndex || {
      collections: {},
      products: {},
      themes: {},
    };

    // Save to memory cache
    SEMANTIC_INDEX_CACHE = index;
    SEMANTIC_INDEX_TIMESTAMP = Date.now();

    console.log(
      `Semantic index loaded: ${Object.keys(index.products || {}).length} products`
    );

    return index;

  } catch (err) {
    console.error("SemanticIndexLoader Error:", err);
    return { collections: {}, products: {}, themes: {} };
  }
}

/* ------------------------------------------------------------
   Clear cache (if needed)
------------------------------------------------------------- */
export function clearSemanticIndexCache() {
  SEMANTIC_INDEX_CACHE = null;
  SEMANTIC_INDEX_TIMESTAMP = null;
}
