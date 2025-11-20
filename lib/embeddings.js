import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Convert a text string into an embedding vector using OpenAI
 */
export async function embedText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("embedText(): text must be a non-empty string");
  }

  const embedding = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });

  return embedding.data[0].embedding;
}
