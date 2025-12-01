/* ============================================================
   TOLDPRINT™ – Semantic Index Merge Helper (lib/semanticMerge.js)
   Purpose:
   - Merge Shopify base index (collections/products) with
     enrichment index (aliases, themes, pages, keywords).
   - Base index is the source of truth for WHAT exists.
   - Enrich index only adds/overrides descriptive fields.
============================================================ */

export function mergeSemanticIndex(baseIndex = {}, enrichIndex = {}) {
  const base = baseIndex || {};
  const enrich = enrichIndex || {};

  const merged = {
    collections: {},
    products: {},
    themeAliases: {},
    categoryAliases: {},
    pages: {},
    lastUpdate: Date.now()
  };

  // ------------------------------------------------------------
  // Collections
  // base.collections: full data from Shopify
  // enrich.collections: extra text/keywords/themes
  // ------------------------------------------------------------
  const baseCols = base.collections || {};
  const enrichCols = enrich.collections || {};

  for (const id in baseCols) {
    const b = baseCols[id] || {};
    const e = enrichCols[id] || {};

    merged.collections[id] = {
      // Base truth
      id: b.id || e.id || id,
      handle: b.handle || e.handle || id,
      title: b.title || e.title || "",
      url: b.url || e.url || "",
      image: b.image || e.image || "",
      productCount: b.productCount || e.productCount || 0,

      // Descriptive fields (από enrich)
      text: e.text || b.text || "",
      themes: e.themes || b.themes || [],
      keywords: e.keywords || b.keywords || []
    };
  }

  // ------------------------------------------------------------
  // Products
  // NOTE: Enrich index ΔΕΝ δημιουργεί νέα products.
  // Shopify (base) είναι η αλήθεια.
  // ------------------------------------------------------------
  const baseProducts = base.products || {};
  const enrichProducts = enrich.products || {}; // πιθανότατα κενό προς το παρόν

  for (const pid in baseProducts) {
    const bp = baseProducts[pid] || {};
    const ep = enrichProducts[pid] || {};

    merged.products[pid] = {
      // Base truth
      id: bp.id || ep.id || pid,
      handle: bp.handle || ep.handle || pid,
      title: bp.title || ep.title || "",
      url: bp.url || ep.url || bp.onlineStoreUrl || "",
      image: bp.image || ep.image || "",
      collection: bp.collection || ep.collection || "",
      productType: bp.productType || ep.productType || "",
      category: bp.category || ep.category || "",
      tags: bp.tags || ep.tags || [],

      // Descriptive / semantic text
      text: ep.text || bp.text || "",
      semantic: ep.semantic || bp.semantic || "",
      keywords: ep.keywords || bp.keywords || [],
      themes: ep.themes || bp.themes || []
    };
  }

  // ------------------------------------------------------------
  // themeAliases / categoryAliases / pages
  // Merge by shallow overwrite: enrich έχει προτεραιότητα.
  // ------------------------------------------------------------
  merged.themeAliases = {
    ...(base.themeAliases || {}),
    ...(enrich.themeAliases || {})
  };

  merged.categoryAliases = {
    ...(base.categoryAliases || {}),
    ...(enrich.categoryAliases || {})
  };

  merged.pages = {
    ...(base.pages || {}),
    ...(enrich.pages || {})
  };

  // lastUpdate: προτίμησε enrich, μετά base, μετά now
  merged.lastUpdate =
    enrich.lastUpdate ||
    base.lastUpdate ||
    Date.now();

  return merged;
}
