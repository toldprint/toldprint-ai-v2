import { fetchAllProducts, keywordFilter } from "./products.js";
import { semanticSearch } from "./search.js";

// Utility: normalize text
const norm = (v) => (v || "").toLowerCase();

export async function productSearch(query) {
  const products = await fetchAllProducts();
  if (!products.length) return [];

  /* ----------------------------------------------
     1) Keyword matches (fast)
  ---------------------------------------------- */
  const kw = keywordFilter(products, query);

  /* ----------------------------------------------
     2) Semantic matches (collections + products)
  ---------------------------------------------- */
  const semantic = await semanticSearch(query, 8);

  const semanticMatches = [];

  for (const node of semantic) {
    const type = node.type;

    /* ----------------------------
       CASE A: Collection Node
    ---------------------------- */
    if (type === "collection") {
      const label = norm(node.label);
      products.forEach((p) => {
        // match by known prefix in Shopify collections
        if (norm(p.title).includes(label)) {
          semanticMatches.push(p);
        }
      });
    }

    /* ----------------------------
       CASE B: Product Node
    ---------------------------- */
    if (type === "product") {
      const title = norm(node.productTitle);
      const handle = norm(node.productHandle);

      const found = products.find(
        (p) =>
          norm(p.title).includes(title) ||
          norm(p.handle).includes(handle)
      );

      if (found) semanticMatches.push(found);
    }
  }

  /* ----------------------------------------------
     3) Merge + dedupe
  ---------------------------------------------- */
  const combined = [...kw, ...semanticMatches];

  const seen = new Set();
  const final = [];
  for (const p of combined) {
    if (!seen.has(p.handle)) {
      seen.add(p.handle);
      final.push(p);
    }
  }

  return final.slice(0, 6);
}

