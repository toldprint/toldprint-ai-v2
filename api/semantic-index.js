import { put, list } from "@vercel/blob";

const INDEX_BLOB = "semantic-index.json";

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    /* ----------------------------------------------------------
       GET — read index from Blob
    ----------------------------------------------------------- */
    if (req.method === "GET") {
      const blobs = await list();
      const existing = blobs.blobs.find((b) => b.pathname === INDEX_BLOB);

      if (!existing) {
        return res.status(200).json({
          status: "empty",
          semanticIndex: {
            collections: {},
            products: {},
            themes: {}
          }
        });
      }

      const response = await fetch(existing.url);
      const text = await response.text();
      const json = JSON.parse(text);

      return res.status(200).json({
        status: "indexed",
        count: Object.keys(json.products || {}).length,
        semanticIndex: json
      });
    }

    /* ----------------------------------------------------------
       POST — update index (NO AUTH)
    ----------------------------------------------------------- */
    if (req.method === "POST") {
      if (!req.body) {
        return res.status(400).json({ error: "Missing JSON body" });
      }

      await put(
        INDEX_BLOB,
        JSON.stringify(req.body, null, 2),
        { access: "public" }
      );

      return res.status(200).json({
        status: "updated",
        count: Object.keys(req.body.products || {}).length
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Semantic Index Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


