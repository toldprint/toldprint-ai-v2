import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/semanticSearch.js";
import { productSearch } from "../lib/productSearch.js";
import { classifyQuery } from "../lib/queryClassifier.js";

// Semantic engine
import { loadSemanticIndex } from "../lib/semanticIndexLoader.js";
import {
  semanticProductResolver,
  setSemanticIndex
} from "../lib/semanticProductResolver.js";

// Pages resolver (NEW, safe)
import {
  setPagesIndex,
  resolvePages
} from "../lib/pageResolver.js";

/* ================================================================
   TOLDPRINT AI — Backend Chat Handler (v3.2 SAFE PAGES)
   • Keeps your exact pipeline
   • Adds pages support (no extra deps)
   • CTA line when products exist
   • Markdown links for policies/help (frontend hides raw)
   • Short polite closing
================================================================ */

const BUILD_ID = "chat-v3-semantic-2025-11-23-pages";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages, debug } = req.body || {};
    const userMessage = messages?.[messages.length - 1]?.content || "";
    const isGreek = /[Ά-ώ]/.test(userMessage);

    /* ------------------------------------------------------------
       LOAD SEMANTIC INDEX (cached)
    ------------------------------------------------------------ */
    const semanticIndex = await loadSemanticIndex();
    setSemanticIndex(semanticIndex);

    // NEW: also cache pages
    setPagesIndex(semanticIndex);
    const pageLinks = resolvePages(userMessage, 3);

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

    const linksText = pageLinks.length
      ? pageLinks.map(l => `LINK: ${l.title} — ${l.url}`).join("\n")
      : "None";

    const systemContext = `
${baseSystemPrompt}

Retrieved contextual knowledge:
${retrievedText || "None"}

Helpful links (use only if relevant):
${linksText}
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

    let reply =
      completion.choices[0].message.content?.trim() ||
      "Let me help you explore our Mediterranean collections.";

    // Strip accidental "products: [...]" tails from model output
    reply = reply.replace(/\n?products:\s*\[[\s\S]*$/i, "").trim();
    reply = reply.replace(/\n?products:\s*\[\s*\]\s*$/i, "").trim();

   /* ------------------------------------------------------------
   POST-PROCESS: CTA + LINKS + POLITE CLOSE (SAFE)
   • CTA μόνο όταν υπάρχουν products
   • Useful links μόνο όταν υπάρχουν pageLinks
   • Polite close μόνο όταν έχει γίνει fulfill
   • Αφαιρεί πιθανά “suggestions below” αν products = 0
------------------------------------------------------------ */

// 0) Clean any model hallucinated CTA lines if NO products
if (!products || products.length === 0) {
  reply = reply.replace(
    /(a few suggestions are below\.?|here are a few suggestions\.?|a few options are below\.?)\s*/gi,
    ""
  );
  reply = reply.replace(
    /(δες μερικές προτάσεις παρακάτω\.?|μερικές προτάσεις είναι παρακάτω\.?)\s*/gi,
    ""
  );
}

// 1) CTA line when products exist (style/collection queries)
if (products && products.length > 0) {
  reply += isGreek
    ? "\n\nΔες μερικές προτάσεις παρακάτω."
    : "\n\nA few suggestions are below.";
}

// 2) Add markdown links so frontend shows label only
if (pageLinks && pageLinks.length > 0) {
  const mdLinks = pageLinks
    .map(l => `• [${l.title}](${l.url})`)
    .join("\n");

  reply += isGreek
    ? `\n\nΧρήσιμοι σύνδεσμοι:\n${mdLinks}`
    : `\n\nUseful links:\n${mdLinks}`;
}

// 3) Remove any duplicated closing follow-ups the model might add
reply = reply.replace(
  /(\n\s*)?(anything else i can help with\??|shall i share collections that carry this spirit\??|χρειάζεσαι κάτι άλλο;?)+\s*$/gi,
  ""
).trim();

// 4) Add ONE short polite close only when request is fulfilled
const shouldClose =
  (products && products.length > 0) ||
  intent?.type === "policy" ||
  intent?.type === "help";

if (shouldClose) {
  reply += isGreek
    ? "\n\nΧρειάζεσαι κάτι άλλο;"
    : "\n\nAnything else I can help with?";
}

    /* ------------------------------------------------------------
       FINAL RESPONSE (+optional debug)
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
      response.pageFound = pageLinks.length;
    }

    return res.status(200).json(response);

  } catch (err) {
    console.error("Chat API Error (v3.2 SAFE):", err);
    return res.status(500).json({
      reply: "Something went wrong — please try again.",
      products: []
    });
  }
}

