import { openai, baseSystemPrompt } from "../lib/openai.js";
import { semanticSearch } from "../lib/search.js";

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
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ error: "messages array is required" });

    const lastUserMessage = messages[messages.length - 1].content;

    // --- STEP 1: Perform semantic search
    const results = await semanticSearch(lastUserMessage, 3);

    const contextBlock =
      results.length > 0
        ? results.map(r => `• (${r.id}) ${r.text}`).join("\n")
        : "No relevant context found.";

    // --- STEP 2: Build full system context
    const systemPrompt = `
${baseSystemPrompt}

Here is relevant knowledge for answering the user's question:

${contextBlock}

Use ONLY the information above when relevant.
If information is missing, say "I don't have enough information for that yet."
    `;

    // --- STEP 3: Send to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.6
    });

    return res.status(200).json({
      reply: completion.choices[0].message,
      retrieved: results // ← helpful for testing
    });

  } catch (err) {
    console.error("CHAT ERROR →", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
