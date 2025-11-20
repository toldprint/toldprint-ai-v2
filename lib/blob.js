import { put, list, get } from "@vercel/blob";

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
 * Load a JSON file from Blob storage
 */
export async function loadJSON(path) {
  try {
    const file = await get(path);
    if (!file)
      return null;

    const text = await file.text();
    return JSON.parse(text);
  } catch (err) {
    console.error("Blob load error:", err);
    return null;
  }
}

/**
 * List files under a prefix (folder)
 */
export async function listBlobs(prefix = "") {
  return list({ prefix });
}
