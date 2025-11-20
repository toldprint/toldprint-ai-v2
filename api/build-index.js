import { saveToBlob } from "../lib/blob.js";
import { embedText } from "../lib/embeddings.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    let body = req.body;

    // If user sends array → ok
    // If user sends object → convert to array of 1
    const items = Array.isArray(body) ? body : [body];

    // Validate each
    const invalid = items.filter(
      (x) => !x.id || !x.text || typeof x.id !== "string" || typeof x.text !== "string"
    );

    if (invalid.length > 0) {
      return res.status(400).json({
        error: "Missing required fields: id, text",
        invalidItems: invalid,
      });
    }

    const indexed = [];

    for (const item of items) {
      const embedding = await embedText(item.text);

      const record = {
        id: item.id,
        text: item.text,
        embedding,
      };

      await saveToBlob(record);
      indexed.push(record);
    }

    return res.status(200).json({
      status: "indexed",
      count: indexed.length,
      indexed,
    });

  } catch (err) {
    console.error("BUILD-INDEX ERROR →", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}

