import { loadJSON, saveJSON } from "./blob.js";

const REGISTRY_PATH = "registry.json";

/**
 * Load registry (semantic index)
 */
export async function loadRegistry() {
  const data = await loadJSON(REGISTRY_PATH);
  return data || { items: [] };
}

/**
 * Save registry
 */
export async function saveRegistry(registry) {
  return await saveJSON(REGISTRY_PATH, registry);
}

/**
 * Add or update an item in the registry
 */
export async function upsertRegistryItem(item) {
  const registry = await loadRegistry();

  const existingIndex = registry.items.findIndex(r => r.id === item.id);

  if (existingIndex >= 0) {
    registry.items[existingIndex] = item;
  } else {
    registry.items.push(item);
  }

  await saveRegistry(registry);
  return registry;
}
