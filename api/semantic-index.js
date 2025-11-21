/**
 * ============================================================
 *   TOLDPRINT AI — SEMANTIC INDEX ENDPOINT (v2)
 * ============================================================
 * This endpoint stores & serves the semantic index containing:
 *   • collections metadata
 *   • product semantic entries
 *   • symbolic meaning nodes
 *
 * It is used by /api/chat for retrieval.
 *
 * STORAGE METHOD:
 *   VERCEL BLOB (recommended)
 *
 * ENDPOINTS:
 *   GET  → returns full semanticIndex JSON
 *   POST → replaces semanticIndex JSON (admin-only via secret token)
 * ============================================================
 */

import { put, list, get } from "@vercel/blob";

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

      // Blob does not exist yet — return empty index
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

      // Fetch blob
      const file = await get(INDEX_BLOB);
      const json = await file.json();

      return res.status(200).json({
        status: "indexed",
        count: Object.keys(json.products || {}).length,
        semanticIndex: json,
      });
    }

    /* ----------------------------------------------------------
       POST → update semantic index
       Requires ADMIN TOKEN to avoid external overwrite.
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

      // Save to Vercel Blob
      await put(INDEX_BLOB, JSON.stringify(newIndex, null, 2), {
        access: "public",
      });

      return res.status(200).json({
        status: "updated",
        message: "Semantic index replaced successfully",
        count: Object.keys(newIndex.products || {}).length,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Semantic index API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
