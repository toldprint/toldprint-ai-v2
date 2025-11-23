// ============================================================
// ToldPrint™ Page Resolver (v1)
// - Uses semanticIndex.pages
// - Multilingual keyword matching (EN/GR/IT/ES)
// ============================================================

let pagesCache = {};

export function setPagesIndex(semanticIndex) {
  pagesCache = semanticIndex?.pages || {};
}

export function resolvePages(query, limit = 3) {
  if (!pagesCache || !query) return [];
  const q = String(query).toLowerCase();

  const hits = [];
  for (const id in pagesCache) {
    const page = pagesCache[id];
    if (!page) continue;

    const kws = (page.keywords || []).map(k => String(k).toLowerCase());
    if (kws.some(k => q.includes(k))) {
      hits.push({
        id,
        title: page.title,
        url: page.url,
        type: page.type || "help"
      });
    }
  }

  return hits.slice(0, limit);
}
