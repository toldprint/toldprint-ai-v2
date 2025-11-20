import { openai } from "../lib/openai.js";
import { upsertRegistryItem } from "../lib/registry.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { id, text } = req.body;

    if (!id || !text) {
      return res.status(400).json({
        error: "Missing required fields: id, text"
      });
    }

    // Create embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    });

    const vector = embeddingResponse.data[0].embedding;

    const item = {
      id,
      text,
      embedding: vector
    };

    const updated = await upsertRegistryItem(item);

    return res.status(200).json({
      status: "indexed",
      indexCount: updated.items.length,
      item
    });

  } catch (err) {
    console.error("BUILD-INDEX ERROR →", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: String(err)
    });
  }
}
