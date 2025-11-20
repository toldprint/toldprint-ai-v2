import { put, list } from "@vercel/blob";

/**
 * Save a JSON file to Blob storage
 */
export async function saveJSON(path, data) {
  const blob = await put(path, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json"
  });
  return blob.url;
}

/**
 * Load JSON file from Blob using public URL
 */
export async function loadJSON(path) {
  try {
    // IMPORTANT: The Blob public URL structure
    const base = process.env.BLOB_BASE_URL || "";
    const url = `${base}/${path}`;

    const res = await fetch(url);

    if (!res.ok) return null;

    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.error("Blob load error:", err);
    return null;
  }
}

/**
 * List blobs using Vercel Blob API
 */
export async function listBlobs(prefix = "") {
  return await list({ prefix });
}
