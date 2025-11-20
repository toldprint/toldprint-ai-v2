import { openai } from "../lib/openai.js";
import { loadRegistry } from "../lib/registry.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages } = req.body;
    const registry = await loadRegistry();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are ToldPrint AI. Use registry knowledge when relevant.` },
        ...messages,
        { role: "system", content: JSON.stringify(registry) }
      ],
      temperature: 0.4
    });

    res.status(200).json({ reply: completion.choices[0].message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
