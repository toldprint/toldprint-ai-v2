import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/semanticSearch.js";
import { productSearch } from "../lib/productSearch.js";
import { classifyQuery } from "../lib/queryClassifier.js";

/* ================================================================
   TOLDPRINT AI — Backend Chat Handler (v2)
   • Short branded reply (1–2 sentences)
   • Semantic retrieval always ON
   • ProductSearch with fallback → semanticSearch
   • Carousel-ready output for frontend widget
================================================================ */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body;

    // 1. Latest user message
    const userMessage = messages[messages.length - 1]?.content || "";

    // 2. Classify query intent (collection / style / product / generic)
    const intent = await classifyQuery(userMessage);

    let products = [];

    // 3. ProductSearch first (structured search)
    if (intent.type === "product" || intent.type === "collection" || intent.type === "category") {
      const structured = await productSearch(userMessage);

      if (structured?.length > 0) {
        products = structured;
      } else {
        // 4. FALLBACK → semanticSearch
        const sem = await semanticSearch(userMessage, { limit: 8 });
        if (sem?.length > 0) products = sem;
      }

    } else {
      // Generic → Try semantic fallback if meaningful
      const sem = await semanticSearch(userMessage, { limit: 6 });
      if (sem?.length > 0) products = sem;
    }

    // 5. Compose internal “context knowledge” for system prompt
    const retrievedText = products
      .map((p) => `PRODUCT: ${p.title} — ${p.description || ""}`)
      .join("\n");

    const systemContext = `
${baseSystemPrompt}

Retrieved contextual knowledge:
${retrievedText || "None"}
    `;

    // 6. Call OpenAI with enriched system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemContext },
        ...messages
      ],
    });

    const reply = completion.choices[0].message.content?.trim() || "Let me help you explore the Mediterranean collection.";

    // 7. Return reply + products for carousel
    return res.status(200).json({
      reply,
      products: Array.isArray(products) ? products : []
    });

  } catch (err) {
    console.error("Chat API Error:", err);
    return res.status(500).json({
      reply: "Something went wrong — please try again.",
      products: []
    });
  }
}

