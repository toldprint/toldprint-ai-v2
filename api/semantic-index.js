/**
 * ============================================================
 *   TOLDPRINT AI — SEMANTIC INDEX ENDPOINT (v2)
 * ============================================================
 */

import { put, list, getBlob } from "@vercel/blob";

const INDEX_BLOB = "semantic-index.json";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    /* ----------------------------------------------------------
       GET → return current semantic index
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
            themes: {},
          },
        });
      }

      // Load blob content correctly (Blob v2)
      const file = await getBlob(INDEX_BLOB);
      const text = await file.text();
      const json = JSON.parse(text);

      return res.status(200).json({
        status: "indexed",
        count: Object.keys(json.products || {}).length,
        semanticIndex: json,
      });
    }

    /* ----------------------------------------------------------
       POST → update semantic index (admin only)
    ----------------------------------------------------------- */
    if (req.method === "POST") {
      const adminToken = req.headers["x-admin-token"];

      if (!adminToken || adminToken !== process.env.ADMIN_UPLOAD_TOKEN) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const newIndex = req.body;

      if (!newIndex) {
        return res.status(400).json({ error: "Missing index JSON" });
      }

      await put(
        INDEX_BLOB,
        JSON.stringify(newIndex, null, 2),
        { access: "public" }
      );

      return res.status(200).json({
        status: "updated",
        message: "Semantic index updated",
        count: Object.keys(newIndex.products || {}).length,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Semantic index error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

