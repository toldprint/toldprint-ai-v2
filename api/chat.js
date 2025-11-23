import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/semanticSearch.js";
import { productSearch } from "../lib/productSearch.js";
import { classifyQuery } from "../lib/queryClassifier.js";

// NEW IMPORTS — semantic engine
import { loadSemanticIndex } from "../lib/semanticIndexLoader.js";
import {
  semanticProductResolver,
  setSemanticIndex
} from "../lib/semanticProductResolver.js";

/* ================================================================
   TOLDPRINT AI — Backend Chat Handler (v3 FINAL)
   • Semantic-index aware
   • Multi-intent product resolver (Option B)
   • ProductSearch fallback → semanticSearch fallback
   • Carousel-ready results
================================================================ */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages } = req.body;
    const userMessage = messages[messages.length - 1]?.content || "";

    /* ------------------------------------------------------------
       LOAD SEMANTIC INDEX (ONCE PER VERCEL INSTANCE)
    ------------------------------------------------------------ */
    const semanticIndex = await loadSemanticIndex();
    setSemanticIndex(semanticIndex); // inject cached index into resolver

    /* ------------------------------------------------------------
       CLASSIFY USER INTENT
    ------------------------------------------------------------ */
    const intent = await classifyQuery(userMessage);

    /* ------------------------------------------------------------
       SEMANTIC PRODUCT RESOLVER (TOP PRIORITY)
    ------------------------------------------------------------ */
    const semanticProducts = semanticProductResolver(userMessage);

    let products = [];

    if (semanticProducts.length > 0) {
      // Semantic match wins
      products = semanticProducts;

    } else {
      /* ------------------------------------------------------------
         STRUCTURED PRODUCT SEARCH (fallback)
      ------------------------------------------------------------ */
      if (
        intent.type === "product" ||
        intent.type === "collection" ||
        intent.type === "category"
      ) {
        const structured = await productSearch(userMessage);
        if (structured?.length > 0) {
          products = structured;
        } else {
          // Second fallback → embedding search
          const sem = await semanticSearch(userMessage, { limit: 8 });
          if (sem?.length > 0) products = sem;
        }

      } else {
        // Generic queries → semanticSearch only
        const sem = await semanticSearch(userMessage, { limit: 6 });
        if (sem?.length > 0) products = sem;
      }
    }

    /* ------------------------------------------------------------
       BUILD KNOWLEDGE CONTEXT FOR OPENAI
    ------------------------------------------------------------ */
    const retrievedText = products
      .map(
        (p) =>
          `PRODUCT: ${p.title} — ${p.description || p.semantic || ""}`
      )
      .join("\n");

    const systemContext = `
${baseSystemPrompt}

Retrieved contextual knowledge:
${retrievedText || "None"}
`;

    /* ------------------------------------------------------------
       OPENAI COMPLETION
    ------------------------------------------------------------ */
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemContext },
        ...messages
      ]
    });

    const reply =
      completion.choices[0].message.content?.trim() ||
      "Let me help you explore our Mediterranean collections.";

    /* ------------------------------------------------------------
       FINAL RESPONSE
    ------------------------------------------------------------ */
    return res.status(200).json({
      reply,
      products: Array.isArray(products) ? products : []
    });

  } catch (err) {
    console.error("Chat API Error (FINAL):", err);
    return res.status(500).json({
      reply: "Something went wrong — please try again.",
      products: []
    });
  }
}

