import { list } from "@vercel/blob";

/**
 * Load semantic-index.json from Vercel Blob
 */
async function loadIndex() {
  const blobs = await list();
  const indexBlob = blobs.blobs.find(b => b.pathname === "semantic-index.json");

  if (!indexBlob) {
    return {
      collections: {},
      products: {},
      themes: {}
    };
  }

  const res = await fetch(indexBlob.url);
  return await res.json();
}

/**
 * Basic fuzzy scoring
 */
function score(text, query) {
  if (!text) return 0;
  text = text.toLowerCase();
  query = query.toLowerCase();
  if (text.includes(query)) return 3;
  if (text.startsWith(query)) return 2;
  if (text.indexOf(query) > -1) return 1;
  return 0;
}

/**
 * Semantic search v2 — fuzzy matching over semantic-index.json
 */
export async function semanticSearch(query) {
  const index = await loadIndex();
  const q = query.toLowerCase();

  let matches = [];

  // Collections
  for (const key in index.collections) {
    const c = index.collections[key];
    const s =
      score(c.name, q) +
      score(c.definition, q) +
      score(c.design_language, q) +
      score(c.purpose, q);

    if (s > 0) {
      matches.push({
        type: "collection",
        key,
        score: s,
        data: c
      });
    }
  }

  // Products
  for (const key in index.products) {
    const p = index.products[key];
    const s =
      score(p.title, q) +
      score(p.meaning, q) +
      score(p.collection, q);

    if (s > 0) {
      matches.push({
        type: "product",
        key,
        score: s,
        data: p
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  return {
    query,
    results: matches.slice(0, 5)
  };
}
