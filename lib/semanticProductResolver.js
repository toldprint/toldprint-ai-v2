/* ============================================================
   TOLDPRINT™ — Semantic Product Resolver (v1.0)
   Multi-intent parsing • Weighted scoring • Synonyms • Collections
   Fully compatible with semantic-index.json
============================================================ */

let semanticCache = null;   // memory cache (Option B)

/* ------------------------------------------------------------
   Inject semantic index (loaded once by semanticIndexLoader)
------------------------------------------------------------- */
export function setSemanticIndex(index) {
  semanticCache = index?.products || {};
}

/* ------------------------------------------------------------
   Main Resolver
------------------------------------------------------------- */
export function semanticProductResolver(query) {
  if (!semanticCache) return [];
  if (!query) return [];

  const products = semanticCache;
  const q = query.toLowerCase().trim();

  // Split query into terms
  const terms = q
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(Boolean);

  // Weighted scoring model
  const W = {
    collection: 7,
    theme: 6,
    category: 5,
    synonym: 4,
    title: 3,
    handle: 3,
    partial: 1,
  };

  const scored = [];

  for (const handle in products) {
    const p = products[handle];

    const pTitle = (p.title || "").toLowerCase();
    const pCollection = (p.collection || "").toLowerCase();
    const pCategory = (p.category || "").toLowerCase();
    const pThemes = (p.themes || []).map(t => t.toLowerCase());
    const pSyn = (p.synonyms || []).map(t => t.toLowerCase());

    let score = 0;

    for (const term of terms) {
      // Collection
      if (pCollection.includes(term)) score += W.collection;

      // Themes
      if (pThemes.some(th => th.includes(term))) score += W.theme;

      // Category
      if (pCategory.includes(term)) score += W.category;

      // Synonyms
      if (pSyn.some(s => s.includes(term))) score += W.synonym;

      // Title
      if (pTitle.includes(term)) score += W.title;

      // Handle
      if (handle.includes(term)) score += W.handle;

      // Partial fuzzy
      if (
        pTitle.startsWith(term) ||
        pCollection.startsWith(term) ||
        pCategory.startsWith(term) ||
        handle.startsWith(term)
      ) {
        score += W.partial;
      }
    }

    if (score > 0) {
      scored.push({
        handle,
        title: p.title || handle,
        url: p.url || "",
        image: p.image || "",
        collection: p.collection || "",
        category: p.category || "",
        themes: p.themes || [],
        score,
      });
    }
  }

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  // Return top 3
  return scored.slice(0, 3);
}
