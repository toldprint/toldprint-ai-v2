/* ============================================================
   TOLDPRINT™ — Semantic Product Resolver (v1.2)
   Multi-intent parsing • Weighted scoring • Synonyms • Collections
   Works with BOTH schemas:
   - enriched semantic-index (themes/category/synonyms)
   - auto-synced index from /api/sync.js (title/collection/text)
   Adds:
   - stopwords removal
   - requires at least one strong match
============================================================ */

let semanticCache = null; // memory cache (Option B inject)

/* ------------------------------------------------------------
   Inject semantic index (loaded by semanticIndexLoader)
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

  // Stopwords (EN + basic GR)
  const STOP = new Set([
    "give","me","show","i","want","need","a","an","the","to","for","of",
    "please","with","and","or",
    "δωσε","μου","δειξε","θελω","ενα","μια","το","την","στα","στο","σε","για"
  ]);

  // Split query into meaningful terms
  const terms = q
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t && !STOP.has(t));

  // Weighted scoring model
  const W = {
    collection: 7,
    theme: 6,
    category: 5,
    synonym: 4,
    title: 3,
    handle: 3,
    text: 2,     // for auto-synced schema long "text"
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
    let strongMatch = false;

    for (const term of terms) {
      // Strong intent matches
      if (pCollection.includes(term)) {
        score += W.collection;
        strongMatch = true;
      }
      if (pThemes.some(th => th.includes(term))) {
        score += W.theme;
        strongMatch = true;
      }
      if (pCategory.includes(term)) {
        score += W.category;
        strongMatch = true;
      }
      if (pSyn.some(s => s.includes(term))) {
        score += W.synonym;
        strongMatch = true;
      }

      // Soft matches
      if (pTitle.includes(term)) score += W.title;
      if (key.includes(term)) score += W.handle;
      if (pText.includes(term)) score += W.text;

      // Partial fuzzy
      if (
        pTitle.startsWith(term) ||
        pCollection.startsWith(term) ||
        pCategory.startsWith(term) ||
        key.startsWith(term)
      ) {
        score += W.partial;
      }
    }

    // Require at least one strong match to avoid noise products
    if (score > 0 && strongMatch) {
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

    // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  // Dedupe by Shopify handle (keep best-scoring entry)
  const seen = new Set();
  const unique = [];
  for (const item of scored) {
    const h = item.handle;
    if (seen.has(h)) continue;
    seen.add(h);
    unique.push(item);
    if (unique.length === 3) break;
  }

  return unique;
