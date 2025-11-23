/* ============================================================
   TOLDPRINT™ — Semantic Product Resolver (v1.1)
   Works with BOTH schemas:
   - enriched semantic-index (themes/category/synonyms)
   - auto-synced index from /api/sync.js (title/collection/text)
============================================================ */

let semanticCache = null;

export function setSemanticIndex(index) {
  semanticCache = index?.products || {};
}

export function semanticProductResolver(query) {
  if (!semanticCache) return [];
  if (!query) return [];

  const products = semanticCache;
  const q = query.toLowerCase().trim();
  const terms = q.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);

  const W = {
    collection: 7,
    theme: 6,
    category: 5,
    synonym: 4,
    title: 3,
    handle: 3,
    text: 2,      // << NEW for auto-synced schema
    partial: 1
  };

  const scored = [];

  for (const key in products) {
    const p = products[key];

    const pTitle = (p.title || "").toLowerCase();
    const pCollection = (p.collection || "").toLowerCase();
    const pCategory = (p.category || "").toLowerCase();
    const pThemes = (p.themes || []).map(t => String(t).toLowerCase());
    const pSyn = (p.synonyms || []).map(t => String(t).toLowerCase());
    const pText = (p.text || p.semantic || p.description || "").toLowerCase();

    let score = 0;

    for (const term of terms) {
      if (pCollection.includes(term)) score += W.collection;
      if (pThemes.some(th => th.includes(term))) score += W.theme;
      if (pCategory.includes(term)) score += W.category;
      if (pSyn.some(s => s.includes(term))) score += W.synonym;
      if (pTitle.includes(term)) score += W.title;
      if (key.includes(term)) score += W.handle;

      // NEW: match inside long text (auto-synced schema)
      if (pText.includes(term)) score += W.text;

      if (
        pTitle.startsWith(term) ||
        pCollection.startsWith(term) ||
        key.startsWith(term)
      ) score += W.partial;
    }

    if (score > 0) {
      scored.push({
        handle: p.handle || key,
        title: p.title || key,
        url: p.url || p.onlineStoreUrl || "",
        image: p.image || "",
        collection: p.collection || "",
        category: p.category || "",
        themes: p.themes || [],
        score
      });
    }
  }

  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, 3);
}

