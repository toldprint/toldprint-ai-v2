// lib/productSearch.js
import { fetchAllProducts, keywordFilter } from "./products.js";
import { semanticSearch } from "./search.js";

/*
  Combined product search:
  1) Keyword pass (fast)
  2) Semantic pass (AI embeddings)
  3) Merge + dedupe
*/

export async function productSearch(query) {
  const products = await fetchAllProducts();
  if (!products.length) return [];

  // keyword matches
  const kw = keywordFilter(products, query);

  // semantic matches from registry
  const semantic = await semanticSearch(query, 5);

  // Map semantic IDs → match Shopify products by title
  const semanticMatches = semantic
    .map(s => products.find(p => p.title.toLowerCase().includes(s.text.toLowerCase())))
    .filter(Boolean);

  // merge & dedupe
  const combined = [...kw, ...semanticMatches];

  // dedupe by handle
  const final = [];
  const seen = new Set();

  for (const p of combined) {
    if (!seen.has(p.handle)) {
      seen.add(p.handle);
      final.push(p);
    }
  }

  return final.slice(0, 6); // limit for chat UX
}
