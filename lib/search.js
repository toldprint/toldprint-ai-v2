import { openai } from "./openai.js";
import { loadRegistry } from "./registry.js";

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (normA * normB);
}

/**
 * Main semantic search function
 */
export async function semanticSearch(query, limit = 3) {
  // Step 1 — Create embedding for the query
  const embedRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query
  });

  const queryVector = embedRes.data[0].embedding;

  // Step 2 — Load registry
  const registry = await loadRegistry();
  if (!registry || !registry.items || registry.items.length === 0) {
    return [];
  }

  // Step 3 — Compute similarity for each item
  const results = registry.items.map(item => ({
    id: item.id,
    text: item.text,
    score: cosineSimilarity(queryVector, item.embedding)
  }));

  // Step 4 — Sort by highest score
  results.sort((a, b) => b.score - a.score);

  // Step 5 — Return top matches
  return results.slice(0, limit);
}
