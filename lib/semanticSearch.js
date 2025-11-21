import { list } from "@vercel/blob";

/**
 * ============================================================
 *   TOLDPRINT — Semantic Search (Reads semantic-index.json)
 * ============================================================
 */
export async function semanticSearch(query, options = {}) {
  const limit = options.limit || 6;

  try {
    // 1. List all blobs
    const blobs = await list();

    // 2. Find semantic-index.json
    const file = blobs.blobs.find((b) =>
      b.pathname.endsWith("semantic-index.json")
    );

    if (!file) {
      console.error("SemanticSearch: semantic-index.json not found");
      return [];
    }

    // 3. Fetch actual file contents (CORRECT method)
    const response = await fetch(file.url);

    if (!response.ok) {
      console.error("SemanticSearch: failed to fetch blob", response.status);
      return [];
    }

    const index = await response.json();
    if (!index) return [];

    const q = query.toLowerCase();
    let matches = [];

    /* ---------------------------------------------------------
       COLLECTION SEARCH
    --------------------------------------------------------- */
    if (index.collections) {
      for (const [key, nodes] of Object.entries(index.collections)) {
        const text = Object.values(nodes).join(" ").toLowerCase();

        if (text.includes(q) || key.toLowerCase().includes(q)) {
          matches.push({
            id: key,
            title: key,
            description: nodes.definition,
            collection: true,
          });
        }
      }
    }

    /* ---------------------------------------------------------
       PRODUCT SEARCH
    --------------------------------------------------------- */
    if (index.products) {
      for (const [id, product] of Object.entries(index.products)) {
        const hay = `${product.title} ${product.description || ""}`.toLowerCase();

        if (hay.includes(q)) {
          matches.push({
            id,
            title: product.title,
            description: product.description,
            url: product.url || "",
            image: product.image || "",
          });
        }
      }
    }

    return matches.slice(0, limit);
  } catch (err) {
    console.error("SemanticSearch error:", err);
    return [];
  }
}


