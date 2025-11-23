// ============================================================
// ToldPrint™ Page Resolver (v1)
// - Matches policy/help/story pages by multilingual keywords
// ============================================================

let pagesCache = {};

export function setPagesIndex(index) {
  pagesCache = index?.pages || index || {};
}

export function resolvePages(query, limit = 3) {
  const q = (query || "").toLowerCase();
  if (!q) return [];

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
