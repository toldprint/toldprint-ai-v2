import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/search.js";
import { embedText } from "../lib/embeddings.js";
import { productSearch } from "../lib/productSearch.js";

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
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // ============================================================
    // STEP 1: Embed query → semantic search
    // ============================================================
    const queryEmbedding = await embedText(lastUserMessage);
    const registryResults = await semanticSearch(queryEmbedding, 3);

    const contextBlock =
      registryResults.length > 0
        ? registryResults.map(r => `• (${r.id}) ${r.text}`).join("\n")
        : "No relevant contextual knowledge.";

    // ============================================================
    // STEP 2: Shopify product search (keyword match)
    // ============================================================
    let products = [];
    try {
      products = await productSearch(lastUserMessage);
    } catch (err) {
      console.warn("Product search error:", err);
      products = [];
    }

    // ============================================================
    // STEP 3: System prompt assembly
    // ============================================================
    const systemPrompt = `
${baseSystemPrompt}

Relevant contextual knowledge:
${contextBlock}

Product data:
${
  products.length
    ? products.map(p => `• ${p.title} — ${p.url}`).join("\n")
    : "No matching products found."
}

Always use ONLY this information.
If information is missing, answer: "I don't have enough information for that yet."
    `;

    // ============================================================
    // STEP 4: OpenAI completion
    // ============================================================
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.6
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I'm here to help.";

    // ============================================================
    // STEP 5: Response
    // ============================================================
    return res.status(200).json({
      reply,
      products,
      retrieved: registryResults
    });

  } catch (err) {
    console.error("CHAT ERROR →", err);
    return res.status(500).json({
      error: "Server error",
      detail: String(err)
    });
  }
}
