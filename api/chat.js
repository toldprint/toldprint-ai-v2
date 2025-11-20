import { openai, baseSystemPrompt } from "../lib/openai.js";

export default async function handler(req, res) {
  // CORS for widget
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: baseSystemPrompt },
        ...messages
      ],
      temperature: 0.6
    });

    return res.status(200).json({
      reply: completion.choices[0].message
    });

  } catch (err) {
    console.error("CHAT ERROR →", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}

