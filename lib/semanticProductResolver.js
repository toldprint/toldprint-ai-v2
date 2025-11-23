/* ============================================================
   TOLDPRINT™ — Semantic Product Resolver (v1.3)
   Multi-intent parsing • Weighted scoring • Synonyms • Collections
   Works with BOTH schemas:
   - enriched semantic-index (themes/category/synonyms + aliases)
   - auto-synced index from /api/sync.js (title/collection/text)
   Adds:
   - stopwords removal
   - accent/diacritics-safe matching (GR/IT/ES)
   - alias expansion (themeAliases/categoryAliases)
   - requires at least one strong match
============================================================ */

let semanticCache = null;   // products cache
let semanticRoot = null;    // full index cache (for aliases)

/* ------------------------------------------------------------
   Accent-safe normalization (GR/IT/ES/EN)
------------------------------------------------------------- */
function norm(s = "") {
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/* ------------------------------------------------------------
   Inject semantic index (loaded by semanticIndexLoader)
------------------------------------------------------------- */
export function setSemanticIndex(index) {
  semanticRoot = index || null;
  semanticCache = index?.products || {};
}

/* ------------------------------------------------------------
   Helper: expand query terms via aliases
------------------------------------------------------------- */
function expandTerms(baseTerms) {
  const expanded = new Set(baseTerms);

  const themeAliases = semanticRoot?.themeAliases || {};
  const categoryAliases = semanticRoot?.categoryAliases || {};

  for (const t of baseTerms) {
    const tn = norm(t);

    // Theme alias expansion: alias -> themes
    for (const alias in themeAliases) {
      if (norm(alias) === tn) {
        const arr = Array.isArray(themeAliases[alias]) ? themeAliases[alias] : [themeAliases[alias]];
        arr.forEach(x => expanded.add(norm(x)));
      }
    }

    // Category alias normalization: alias -> canonical category
    for (const alias in categoryAliases) {
      if (norm(alias) === tn) {
        expanded.add(norm(categoryAliases[alias]));
      }
    }
  }

  return [...expanded];
}

/* ------------------------------------------------------------
   Main Resolver
------------------------------------------------------------- */
export function semanticProductResolver(query) {
  if (!semanticCache) return [];
  if (!query) return [];

  const products = semanticCache;
  const qn = norm(query);

  // Stopwords (EN + basic GR)
  const STOP = new Set([
    "give","me","show","i","want","need","a","an","the","to","for","of",
    "please","with","and","or","do","you","have","one","some",
    "δωσε","μου","δειξε","θελω","ενα","μια","το","την","στα","στο","σε","για","εχετε","εχεις",
    "μπορεις","να","μου","δειξε","ενα","μερικα"
  ]);

  // Split query into meaningful terms (accent-safe)
  const baseTerms = qn
    .split(/[\s,]+/)
    .map(t => t.trim())
    .filter(t => t && !STOP.has(t));

  // Expand terms using aliases
  const terms = expandTerms(baseTerms);

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

    // Normalize product fields once
    const pTitle = norm(p.title || "");
    const pCollection = norm(p.collection || "");
    const pCategory = norm(p.category || p.productType || "");
    const pThemes = (p.themes || []).map(norm);
    const pSyn = (p.synonyms || []).map(norm);
    const pKeywords = (p.keywords || []).map(norm);
    const pTags = (p.tags || []).map(norm);
    const pText = norm(p.text || p.semantic || p.description || "");

    let score = 0;
    let strongMatch = false;

    for (const term of terms) {
      if (!term) continue;

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

      // synonyms / keywords / tags as strong-ish signals too
      if (pSyn.some(s => s.includes(term))) {
        score += W.synonym;
        strongMatch = true;
      }
      if (pKeywords.some(k => k.includes(term))) {
        score += W.synonym;
        strongMatch = true;
      }
      if (pTags.some(tg => tg.includes(term))) {
        score += W.synonym;
        strongMatch = true;
      }

      // Soft matches
      if (pTitle.includes(term)) score += W.title;
      if (norm(key).includes(term)) score += W.handle;
      if (pText.includes(term)) score += W.text;

      // Partial fuzzy
      if (
        pTitle.startsWith(term) ||
        pCollection.startsWith(term) ||
        pCategory.startsWith(term) ||
        norm(key).startsWith(term)
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
        category: p.category || p.productType || "",
        themes: p.themes || [],
        score
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

