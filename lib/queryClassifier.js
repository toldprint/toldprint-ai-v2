// lib/queryClassifier.js

/**
 * ============================================================
 *  TOLDPRINT AI — Query Classifier (v3)
 *  Converts user text → structured intent
 *  SAFE PATCH: adds `type` + richer triggers
 * ============================================================
 */

export function classifyQuery(userText) {
  const q = (userText || "").toLowerCase().trim();

  /* -----------------------------------------
     0) POLICY / HELP detection (for pages links)
  ----------------------------------------- */
  const policyTriggers = [
    "return", "returns", "refund", "exchange", "shipping", "delivery",
    "policy", "policies", "privacy", "terms", "legal", "gdpr", "cookies",
    "επιστροφή", "επιστροφές", "αλλαγή", "αντικατάσταση", "ακύρωση",
    "αποστολή", "παράδοση", "μεταφορικά", "όροι", "απόρρητο", "νομικά",
    "reso", "resi", "rimborso", "spedizione", "privacy", "termini",
    "devolución", "devoluciones", "reembolso", "envío", "privacidad", "términos"
  ];

  const helpTriggers = [
    "size", "sizes", "sizing", "fit", "measure", "care", "wash", "faq",
    "guide", "contact", "about", "sustainability", "ambassador", "blog",
    "μέγεθος", "μεγέθη", "νούμερο", "οδηγός", "φροντίδα", "πλύσιμο",
    "συχνές ερωτήσεις", "επικοινωνία", "σχετικά", "βιωσιμότητα",
    "taglia", "taglie", "cura", "lavaggio", "contatto", "chi siamo",
    "talla", "tallas", "cuidado", "lavado", "contacto", "sobre nosotros"
  ];

  const isPolicy = policyTriggers.some(t => q.includes(t));
  const isHelp   = helpTriggers.some(t => q.includes(t));

  /* -----------------------------------------
     1) CATEGORY detection (multi-lingual)
     Normalized buckets: hoodie / sweatshirt / tee / tote / hat / mug
  ----------------------------------------- */
  const categoryMap = [
    { match: ["hoodie", "hoodies", "zip hoodie", "pullover"], category: "hoodie" },
    { match: ["sweatshirt", "sweatshirts", "crewneck", "jumper"], category: "sweatshirt" },
    { match: ["tee", "t-shirt", "tshirt", "t-shirts", "shirt"], category: "tee" },
    { match: ["tote", "tote bag", "bag", "totes"], category: "tote" },
    { match: ["cap", "caps", "hat", "beanie"], category: "hat" },
    { match: ["mug", "mugs", "cup"], category: "mug" },

    // GR
    { match: ["φούτερ", "hoodie φούτερ"], category: "hoodie" },
    { match: ["μπλούζα φούτερ", "μπλούζες φούτερ"], category: "sweatshirt" },
    { match: ["μπλουζάκι", "μπλουζάκια", "μπλούζα", "μπλούζες"], category: "tee" },
    { match: ["τσάντα", "τσάντες"], category: "tote" },
    { match: ["καπέλο", "καπέλα", "σκουφί"], category: "hat" },
    { match: ["κούπα", "κούπες"], category: "mug" },

    // IT
    { match: ["felpa", "felpe"], category: "hoodie" },
    { match: ["maglietta", "t-shirt italiana"], category: "tee" },
    { match: ["borsa", "borsa tote"], category: "tote" },
    { match: ["cappello", "cappelli"], category: "hat" },
    { match: ["tazza", "tazze"], category: "mug" },

    // ES
    { match: ["sudadera", "sudaderas"], category: "hoodie" },
    { match: ["camiseta", "camisetas"], category: "tee" },
    { match: ["bolsa", "bolsas"], category: "tote" },
    { match: ["gorra", "gorras"], category: "hat" },
    { match: ["taza", "tazas"], category: "mug" }
  ];

  let detectedCategory = null;
  for (const entry of categoryMap) {
    if (entry.match.some(m => q.includes(m))) {
      detectedCategory = entry.category;
      break;
    }
  }

  /* -----------------------------------------
     2) COLLECTION detection (multi-lingual + style terms)
     We only set collection when user likely refers to it.
  ----------------------------------------- */
  const collectionMap = [
    { match: ["sea & solidarity", "sea and solidarity", "safe passage", "solidarity", "refugee", "migration", "ναυτικό", "θάλασσα", "sea", "ocean", "wave"], collection: "sea-solidarity" },
    { match: ["ancient revival", "ancient greek", "mythology", "medusa", "labyrinth", "owl", "αρχαίο ελληνικό", "μυθολογία", "μέδουσα", "λαβύρινθος", "κουκουβάγια"], collection: "ancient-revival" },
    { match: ["voices of the med", "voices", "mediterranean", "μεσόγειος"], collection: "voices-med" },
    { match: ["blooming mediterranean", "pomegranate", "abundance", "ρόδι", "pomos"], collection: "blooming-med" },
    { match: ["mystic med", "protection symbol", "amulet", "φυλαχτό"], collection: "mystic-med" },
    { match: ["spanishify", "latin", "fiesta", "españa", "español"], collection: "spanishify" },
    { match: ["cyprify", "cypriot", "cyprus", "κύπρος", "pomos idol"], collection: "cyprify" },
    { match: ["greekify", "greek", "opa", "philoxenia", "ελληνικό", "ελλάδα"], collection: "greekify" },
    { match: ["italify", "italy", "italian", "italia"], collection: "italify" }
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
  ----------------------------------------- */
  if (q.includes("winter") || q.includes("warm") || q.includes("cold") ||
      q.includes("χειμ") || q.includes("ζεστ")) {
    detectedCategory = detectedCategory || "hoodie";
  }

  if (q.includes("show me") || q.includes("δείξε μου") || q.includes("θέλω να δω")) {
    if (!detectedCategory && q.includes("hood")) detectedCategory = "hoodie";
    if (!detectedCategory && q.includes("sweat")) detectedCategory = "sweatshirt";
    if (!detectedCategory && (q.includes("tee") || q.includes("t-shirt") || q.includes("μπλουζ"))) detectedCategory = "tee";
  }

  /* -----------------------------------------
     4) FINAL INTENT TYPE
  ----------------------------------------- */
  let type = "generic";
  if (isPolicy) type = "policy";
  else if (isHelp) type = "help";
  else if (detectedCollection && detectedCategory) type = "collection_category";
  else if (detectedCollection) type = "collection";
  else if (detectedCategory) type = "category";

  return {
    raw: userText,
    type,
    category: detectedCategory,       // normalized (hoodie/sweatshirt/tee/tote/hat/mug)
    collection: detectedCollection,   // normalized handle bucket
    semantic: q
  };
}

