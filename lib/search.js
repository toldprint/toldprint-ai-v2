import { loadBlobJSON } from "./blob.js";

/**
 * Compute cosine similarity between two embedding vectors
 */
function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Returns the best semantic matches for a query embedding
 */
export async function semanticSearch(queryEmbedding, topK = 3) {
  // Load registry from Blob
  const registry = (await loadBlobJSON("registry.json")) || [];

  if (!Array.isArray(registry) || registry.length === 0) {
    console.warn("semanticSearch(): registry is empty");
    return [];
  }

  // Compute scores
  const scored = registry.map((item) => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Return top K
  return scored.slice(0, topK);
}
