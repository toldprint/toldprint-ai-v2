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
       GET — read LATEST semantic-index*.json from Blob (1B only)
    ----------------------------------------------------------- */
    if (req.method === "GET") {
      const blobs = await list();

      // 1B: accept versioned blobs too
      const candidates = (blobs?.blobs || []).filter((b) =>
        b.pathname?.startsWith("semantic-index") &&
        b.pathname?.endsWith(".json")
      );

      if (!candidates.length) {
        return res.status(200).json({
          status: "empty",
          semanticIndex: {
            collections: {},
            products: {},
            themes: {}
          }
        });
      }

      // pick latest by uploadedAt (fallback to pathname)
      candidates.sort((a, b) => {
        const ta = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const tb = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        if (ta !== tb) return tb - ta;
        return (b.pathname || "").localeCompare(a.pathname || "");
      });

      const latest = candidates[0];

      const response = await fetch(latest.url);
      const text = await response.text();
      const json = JSON.parse(text);

      return res.status(200).json({
        status: "indexed",
        count: Object.keys(json.products || {}).length,
        semanticIndex: json
      });
    }

    /* ----------------------------------------------------------
       POST — update index (NO AUTH)  [unchanged]
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



