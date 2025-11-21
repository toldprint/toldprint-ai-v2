// lib/queryClassifier.js

/**
 * ============================================================
 *  TOLDPRINT AI — Query Classifier (v2)
 *  Converts user text → structured search intent
 * ============================================================
 */

export function classifyQuery(userText) {
  const q = userText.toLowerCase().trim();

  /* -----------------------------------------
     1) CATEGORY detection
  ----------------------------------------- */
  const categoryMap = [
    { match: ["hoodie", "hoodies"], category: "hoodies" },
    { match: ["sweatshirt", "sweatshirts", "crewneck"], category: "sweatshirts" },
    { match: ["tote", "bag", "tote bag", "totes"], category: "tote-bags" },
    { match: ["tee", "t-shirt", "shirt"], category: "tshirts" },
    { match: ["mug", "cup"], category: "mugs" }
  ];

  let detectedCategory = null;
  for (const entry of categoryMap) {
    if (entry.match.some(m => q.includes(m))) {
      detectedCategory = entry.category;
      break;
    }
  }

  /* -----------------------------------------
     2) COLLECTION detection
  ----------------------------------------- */
  const collectionMap = [
    { match: ["sea & solidarity", "sea and solidarity", "solidarity", "safe passage"], collection: "sea-solidarity" },
    { match: ["ancient revival", "ancient", "mythology"], collection: "ancient-revival" },
    { match: ["voices of the med", "voices", "med"], collection: "voices-med" },
    { match: ["blooming mediterranean", "pomegranate", "abundance"], collection: "blooming-med" },
    { match: ["mystic med", "protection symbol", "spiritual"], collection: "mystic-med" },
    { match: ["spanishify", "latin", "latin vibes", "fiesta"], collection: "spanishify" },
    { match: ["cypriot", "pomos", "cyprus"], collection: "cypriot-icons" },
    { match: ["greekify", "greek", "opa", "philoxenia"], collection: "greekify" }
  ];

  let detectedCollection = null;
  for (const entry of collectionMap) {
    if (entry.match.some(m => q.includes(m))) {
      detectedCollection = entry.collection;
      break;
    }
  }

  /* -----------------------------------------
     3) SPECIAL BEHAVIOR
     “Show me hoodies”
     “Winter styles”
     “Unisex Hoodies”
     “Oversized Fit”
  ----------------------------------------- */
  if (
    q.includes("winter") ||
    q.includes("warm") ||
    q.includes("cold")
  ) {
    detectedCategory = detectedCategory || "hoodies";
  }

  if (q.includes("show me")) {
    if (!detectedCategory && q.includes("hood")) detectedCategory = "hoodies";
    if (!detectedCategory && q.includes("sweat")) detectedCategory = "sweatshirts";
  }

  /* -----------------------------------------
     4) FINAL STRUCTURED QUERY
  ----------------------------------------- */
  return {
    raw: userText,
    category: detectedCategory,       // e.g. "hoodies"
    collection: detectedCollection,   // e.g. "sea-solidarity"
    semantic: q                       // used when no direct match found
  };
}
