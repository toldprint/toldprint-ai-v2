console.log("CHAT.JS — LIVE BUILD v4-pages");
import OpenAI from "openai";
import { loadRegistry } from "../data/toldprint-core.js";
import { semanticSearch } from "./semanticSearch.js";
import { shopifySearch } from "./shopify.js";
import { resolvePages, setPagesIndex } from "./pageResolver.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "Invalid payload" });

    const userMessage = messages[messages.length - 1]?.content || "";
    const userLang = detectLanguage(userMessage);

    // ==========================================================
    // 1. LOAD TOLDPRINT™ REGISTRY
    // ==========================================================
    const registry = await loadRegistry();

    const staticBlocks = registry.staticBlocks || [];
    const semanticBlocks = registry.semanticBlocks || [];

    // ==========================================================
    // 1B. LOAD PAGES INDEX (registry.pages OR semantic-index Blob)
    // ==========================================================
    const pagesIndex = await loadPagesIndexSafe(registry);
    setPagesIndex({ pages: pagesIndex });
    const pageLinks = resolvePages(userMessage, 3);

    // Safety logs
    if (!Array.isArray(staticBlocks))
      console.error("Static blocks missing or invalid:", staticBlocks);

    if (!Array.isArray(semanticBlocks))
      console.error("Semantic blocks missing or invalid:", semanticBlocks);

    // ==========================================================
    // 2. SEMANTIC SEARCH
    // ==========================================================
    const semanticResults = await semanticSearch(userMessage, {
      semanticBlocks
    });

    let bestKnowledgeBlock = "";

    // Semantic top match
    if (semanticResults?.length) {
      bestKnowledgeBlock = semanticResults[0].content || "";
    }

    // ==========================================================
    // 3. STATIC KNOWLEDGE FALLBACK (if semantic empty)
    // ==========================================================
    if (!bestKnowledgeBlock && staticBlocks.length) {
      const lower = userMessage.toLowerCase();

      const found = staticBlocks.find((b) => {
        const id = (b.id || "").toLowerCase();
        return (
          id.includes("ship") ||
          id.includes("return") ||
          id.includes("refund") ||
          id.includes("policy") ||
          id.includes("care") ||
          id.includes("size") ||
          id.includes("about") ||
          id.includes("faq") ||
          id.includes("sustain")
        );
      });

      if (found?.content) bestKnowledgeBlock = found.content;
    }

    // ==========================================================
    // 4. SHOPIFY LIVE PRODUCT SEARCH
    // ==========================================================
    const shopifyProducts = await shopifySearch(userMessage);

    // ==========================================================
    // 5. SYSTEM PROMPT
    // ==========================================================
    const systemPrompt = `
You are the official ToldPrint™ Assistant.

RULES:
- Provide accurate answers ONLY from the knowledge provided below.
- If you cannot confirm something from these blocks → say: "I don’t have this information yet."
- Never invent policies, shipping rules, product details, or locations.
- Never mention Shopify, API, JSON, or internal systems.
- Language: respond in ${userLang}.
- Keep answers short, factual, Mediterranean-themed.
- If user asks about products → use the product list I will provide.
- Rewrite semantic block content naturally, but never add new facts.
`;

    // ==========================================================
    // 6. AI COMPLETION
    // ==========================================================
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        {
          role: "assistant",
          content: `
INTERNAL KNOWLEDGE:
${bestKnowledgeBlock || "No direct match."}

HELPFUL LINKS:
${
  pageLinks?.length
    ? pageLinks.map(l => `${l.title} — ${l.url}`).join("\n")
    : "None"
}

PRODUCTS:
${JSON.stringify(shopifyProducts || [], null, 2)}
`
        }
      ]
    });

    let reply = completion.choices[0].message.content || "";
    reply = sanitize(reply, shopifyProducts);

    // Append links AFTER sanitize (so they don't get stripped)
    if (pageLinks?.length) {
      reply +=
        `\n\nUseful links:\n` +
        pageLinks.map(l => `${l.title}: ${l.url}`).join("\n");
    }

    return res.status(200).json({
      reply,
      products: Array.isArray(shopifyProducts)
        ? shopifyProducts.slice(0, 15)
        : []
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({
      reply: "There was a server issue. Please try again.",
      products: []
    });
  }
}

/* ==========================================================
   LOAD PAGES INDEX SAFELY
   - prefers registry.pages
   - fallback to semantic-index Blob via API
========================================================== */
async function loadPagesIndexSafe(registry) {
  try {
    if (registry?.pages && Object.keys(registry.pages).length) {
      return registry.pages;
    }

    const res = await fetch(
      "https://toldprint-ai-v2.vercel.app/api/semantic-index"
    );
    const j = await res.json();

    let idx = j?.semanticIndex || j || {};
    // unwrap nested semanticIndex wrappers if they ever exist again
    while (idx?.semanticIndex) idx = idx.semanticIndex;

    return idx.pages || {};
  } catch (err) {
    console.error("Pages Index Error:", err);
    return {};
  }
}

/* ==========================================================
   LANGUAGE DETECTOR
========================================================== */
function detectLanguage(text) {
  const greek = /[Ά-ώ]/;
  if (greek.test(text)) return "Greek";
  return "English";
}

/* ==========================================================
   SANITIZER — clean hallucinations, links, markdown
========================================================== */
function sanitize(payload, products) {
  if (!payload) return "";

  let out = payload;

  out = out.replace(/\[([^\]]+)\]\((.*?)\)/g, "$1"); // remove markdown
  out = out.replace(/\n{3,}/g, "\n\n");

  // remove repeating product names
  if (products?.length) {
    products.forEach((p) => {
      if (!p?.title) return;
      const safe = p.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(safe, "gi"), "");
    });
  }

  return out.trim();
}


