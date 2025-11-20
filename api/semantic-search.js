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
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const results = await semanticSearch(query, 3);

    return res.status(200).json({ results });

  } catch (err) {
    console.error("SEMANTIC SEARCH ERROR →", err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
