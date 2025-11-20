import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/search.js";
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
    const { messages, mode } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "messages array is required" });

    const lastUserMessage =
      messages[messages.length - 1]?.content || "";

    // ============================================================
    // STEP 1: Semantic search on registry
    // ============================================================
    const registryResults = await semanticSearch(lastUserMessage, 3);

    const contextBlock =
      registryResults.length > 0
        ? registryResults.map(r => `• (${r.id}) ${r.text}`).join("\n")
        : "No relevant context found.";

    // ============================================================
    // STEP 2: Shopify product search (keyword + semantic hybrid)
    // ============================================================
    const products = await productSearch(lastUserMessage);

    // ============================================================
    // STEP 3: System prompt assembly
    // ============================================================
    const systemPrompt = `
${baseSystemPrompt}

Relevant contextual knowledge:

${contextBlock}

If the user is asking about products, use the product list provided to you:

${products
  .map(
    p =>
      `• ${p.title} — ${p.url || "no-url"}`
  )
  .join("\n")}

If information is missing, reply: "I don't have enough information for that yet."
    `;

    // ============================================================
    // STEP 4: OpenAI Call
    // ============================================================
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.6
    });

    const replyText =
      completion.choices?.[0]?.message?.content || "I’m here to help.";

    // ============================================================
    // STEP 5: Return combined semantic + product results
    // ============================================================
    return res.status(200).json({
      reply: replyText,
      products: products || [],
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
