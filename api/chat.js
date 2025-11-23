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
   TOLDPRINT AI — Backend Chat Handler (v3 + Debug Build)
   • Semantic-index aware (Option B memory cached)
   • Multi-intent weighted resolver
   • ProductSearch → semanticSearch fallback chain
   • Carousel-ready response
   • Debug fields for validation
================================================================ */

const BUILD_ID = "chat-v3-semantic-2025-11-23";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages, debug } = req.body;
    const userMessage = messages?.[messages.length - 1]?.content || "";

    /* ------------------------------------------------------------
       LOAD SEMANTIC INDEX (ONCE PER INSTANCE)
    ------------------------------------------------------------ */
    const semanticIndex = await loadSemanticIndex();
    setSemanticIndex(semanticIndex);

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
          const sem = await semanticSearch(userMessage, { limit: 8 });
          if (sem?.length > 0) products = sem;
        }
      } else {
        const sem = await semanticSearch(userMessage, { limit: 6 });
        if (sem?.length > 0) products = sem;
      }
    }

    /* ------------------------------------------------------------
       BUILD KNOWLEDGE CONTEXT FOR OPENAI
    ------------------------------------------------------------ */
    const retrievedText = (products || [])
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
       FINAL RESPONSE (+ optional debug)
    ------------------------------------------------------------ */
    const response = {
      reply,
      products: Array.isArray(products) ? products : []
    };

    if (debug) {
      response.build = BUILD_ID;
      response.semanticCount = Object.keys(
        semanticIndex?.products || {}
      ).length;
      response.semanticFound = semanticProducts.length;
      response.sampleCollections = Object.keys(
        semanticIndex?.collections || {}
      ).slice(0, 5);
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Chat API Error (DEBUG BUILD):", err);
    return res.status(500).json({
      reply: "Something went wrong — please try again.",
      products: []
    });
  }
}
