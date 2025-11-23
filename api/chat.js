console.log("CHAT.JS — LIVE BUILD v5 (no-registry + pages)");

import OpenAI from "openai";
import { semanticSearch } from "./semanticSearch.js";
import { shopifySearch } from "./shopify.js";
import { resolvePages, setPagesIndex } from "./pageResolver.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const userMessage = messages[messages.length - 1]?.content || "";
    const userLang = detectLanguage(userMessage);

    // ==========================================================
    // 1) LOAD PAGES from semantic-index Blob
    // ==========================================================
    const pagesIndex = await loadPagesIndexSafe();
    setPagesIndex({ pages: pagesIndex });
    const pageLinks = resolvePages(userMessage, 3);

    // ==========================================================
    // 2) SEMANTIC SEARCH (safe empty blocks for now)
    // ==========================================================
    const semanticResults = await semanticSearch(userMessage, {
      semanticBlocks: []
    });

    const bestKnowledgeBlock =
      semanticResults?.length ? (semanticResults[0].content || "") : "";

    // ==========================================================
    // 3) SHOPIFY LIVE PRODUCT SEARCH
    // ==========================================================
    const shopifyProducts = await shopifySearch(userMessage);

    // ==========================================================
    // 4) SYSTEM PROMPT
    // ==========================================================
    const systemPrompt = `
You are the official ToldPrint™ Assistant.

RULES:
- Use ONLY the knowledge blocks and products provided below.
- If something is not present, say you don't have that info yet.
- Never invent policies, shipping rules, product details, locations.
- Never mention Shopify, APIs, JSON, internal systems.
- Language: respond in ${userLang}.
- Keep answers short, factual, Mediterranean tone.
- If products are provided, introduce them briefly so the carousel makes sense.
- If helpful links are provided, reference them as clickable text (not raw URLs).
- End politely with a short helpful closing line (not verbose).
`;

    // ==========================================================
    // 5) AI COMPLETION
    // ==========================================================
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
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

    let reply =
      completion.choices[0].message.content?.trim() ||
      "Let me help you explore ToldPrint™.";

    // ==========================================================
    // 6) APPEND LINKS as MARKDOWN LABELS (no raw URLs)
    // ==========================================================
    if (pageLinks?.length) {
      const mdLinks = pageLinks
        .map(l => `• [${l.title}](${l.url})`)
        .join("\n");
      reply += `\n\nUseful links:\n${mdLinks}`;
    }

    // Gentle close (short)
    reply += userLang === "Greek"
      ? "\n\nΑν θέλεις, μπορώ να σου δείξω κι άλλα σχετικά προϊόντα."
      : "\n\nIf you’d like, I can show you more related picks.";

    return res.status(200).json({
      reply,
      products: Array.isArray(shopifyProducts)
        ? shopifyProducts.slice(0, 15)
        : [],
      build: "chat-v5-no-registry-pages"
    });

  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      reply: "There was a server issue. Please try again.",
      products: []
    });
  }
}

/* ==========================================================
   LOAD PAGES INDEX SAFELY from semantic-index API
========================================================== */
async function loadPagesIndexSafe() {
  try {
    const res = await fetch(
      "https://toldprint-ai-v2.vercel.app/api/semantic-index"
    );
    const j = await res.json();

    // unwrap nested semanticIndex wrappers if they ever exist
    let idx = j?.semanticIndex || j || {};
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



