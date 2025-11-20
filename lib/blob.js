import { put, list } from "@vercel/blob";

/**
 * Load JSON registry from Vercel Blob Storage
 */
export async function loadBlobJSON(path) {
  try {
    const files = await list();
    const file = files.blobs.find(b => b.pathname === path);

    if (!file) return null;

    const res = await fetch(file.url);
    return await res.json();

  } catch (err) {
    console.error("loadBlobJSON() error:", err);
    return null;
  }
}

/**
 * Save JSON to Blob Storage (overwrite)
 */
export async function saveBlobJSON(path, data) {
  try {
    const res = await put(path, JSON.stringify(data, null, 2), {
      contentType: "application/json",
      access: "public"
    });

    return res;

  } catch (err) {
    console.error("saveBlobJSON() error:", err);
    throw err;
  }
}

/**
 * Append an item to a JSON array stored in Blob Storage
 */
export async function appendBlobJSON(path, newItem) {
  const registry = (await loadBlobJSON(path)) || [];
  if (!Array.isArray(registry)) {
    throw new Error("Registry must be an array to append.");
  }

  registry.push(newItem);

  await saveBlobJSON(path, registry);

  return registry;
}

/**
 * saveToBlob (alias for appendBlobJSON for clarity)
 */
export async function saveToBlob(path, item) {
  return appendBlobJSON(path, item);
}
