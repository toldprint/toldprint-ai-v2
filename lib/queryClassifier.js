/**
 * ============================================================
 *   TOLDPRINT AI — QUERY CLASSIFIER (v2)
 *   Converts raw user text → structured search intent
 * ============================================================
 */

export function classifyQuery(inputRaw = "") {
  const input = inputRaw.toLowerCase().trim();

  /* -------------------------------------------
     1) COLLECTION INTENTS
  ------------------------------------------- */
  if (input.includes("ancient") || input.includes("revival"))
    return { type: "collection", slug: "ancient-revival" };

  if (input.includes("sea") || input.includes("solidarity"))
    return { type: "collection", slug: "sea-and-solidarity" };

  if (input.includes("voices"))
    return { type: "collection", slug: "voices-of-the-med" };

  if (input.includes("greekify") || input.includes("greek"))
    return { type: "collection", slug: "greekify" };

  if (input.includes("spanishify") || input.includes("latin"))
    return { type: "collection", slug: "spanishify" };

  if (input.includes("cypriot") || input.includes("pomos"))
    return { type: "collection", slug: "cypriot-icons" };

  if (input.includes("bloom") || input.includes("pomegranate"))
    return { type: "collection", slug: "blooming-mediterranean" };

  /* -------------------------------------------
     2) PRODUCT CATEGORY / STYLE INTENTS
  ------------------------------------------- */
  if (input.includes("hoodie") || input.includes("hoodies"))
    return { type: "category", category: "hoodies" };

  if (input.includes("sweatshirt") || input.includes("sweatshirts"))
    return { type: "category", category: "sweatshirts" };

  if (input.includes("tote") || input.includes("bag"))
    return { type: "category", category: "tote-bags" };

  if (input.includes("tee") || input.includes("t-shirt"))
    return { type: "category", category: "t-shirts" };

  if (input.includes("mug"))
    return { type: "category", category: "mugs" };

  if (input.includes("winter"))
    return { type: "category", category: "winter-styles" };

  if (input.includes("oversized"))
    return { type: "category", category: "oversized" };

  if (input.includes("unisex"))
    return { type: "category", category: "unisex" };

  /* -------------------------------------------
     3) SYMBOL / THEME INTENTS (semantic)
  ------------------------------------------- */
  if (input.includes("medusa"))
    return { type: "theme", theme: "medusa" };

  if (input.includes("owl"))
    return { type: "theme", theme: "owl" };

  if (input.includes("labyrinth") || input.includes("maze"))
    return { type: "theme", theme: "labyrinth" };

  if (input.includes("anchor"))
    return { type: "theme", theme: "anchor" };

  if (input.includes("pomegranate"))
    return { type: "theme", theme: "pomegranate" };

  if (input.includes("seal"))
    return { type: "theme", theme: "monk-seal" };

  if (input.includes("nautical") || input.includes("sailing"))
    return { type: "theme", theme: "nautical" };

  if (input.includes("latin") || input.includes("floral") || input.includes("sun"))
    return { type: "theme", theme: "latin-mediterranean" };

  /* -------------------------------------------
     4) FALLBACK: SEARCH EVERYTHING
  ------------------------------------------- */
  return {
    type: "general",
    q: inputRaw.trim(),
  };
}
