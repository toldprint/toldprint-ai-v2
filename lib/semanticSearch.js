import { list, get } from "@vercel/blob";

/**
 * ============================================================
 *   TOLDPRINT — Semantic Search (Reads semantic-index.json)
 * ============================================================
 */

export async function semanticSearch(query, options = {}) {
  const limit = options.limit || 6;

  try {
    // Find semantic-index.json inside Blob registry
    const blobs = await list();

    const file = blobs.blobs.find((b) =>
      b.pathname.endsWith("semantic-index.json")
    );

    if (!file) return [];

    // Fetch the index content
    const result = await fetch(file.url);
    const index = await result.json();

    if (!index) return [];

    const q = query.toLowerCase();
    let matches = [];

    // Collections
    if (index.collections) {
      for (const [key, nodes] of Object.entries(index.collections)) {
        const text = Object.values(nodes).join(" ").toLowerCase();
        if (text.includes(q) || key.toLowerCase().includes(q)) {
          matches.push({
            id: key,
            title: key,
            description: nodes.definition,
            collection: true
          });
        }
      }
    }

    // Products
    if (index.products) {
      for (const [id, product] of Object.entries(index.products)) {
        const hay =
          `${product.title} ${product.description || ""}`
            .toLowerCase();

        if (hay.includes(q)) {
          matches.push({
            id,
            title: product.title,
            description: product.description,
            url: product.url || "",
            image: product.image || ""
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

