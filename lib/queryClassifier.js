// lib/queryClassifier.js

/**
 * ============================================================
 *  TOLDPRINT AI — Query Classifier (v3)
 *  Converts user text → structured search intent
 *
 *  IMPORTANT:
 *  - chat.js expects intent.type in {"product","collection","category","generic"}
 *  - We keep previous fields (category, collection, semantic) for compatibility.
 * ============================================================
 */

export function classifyQuery(userText) {
  const q = (userText || "").toLowerCase().trim();

  /* -----------------------------------------
     1) CATEGORY detection (EN/GR/IT/ES)
     -> returns your store category handles
  ----------------------------------------- */
  const categoryMap = [
    // Hoodies
    {
      match: [
        "hoodie", "hoodies", "pullover hoodie", "zip hoodie",
        "φούτερ", "φουτερ", "ζακέτα φούτερ", "hoodie φούτερ",
        "felpa", "felpe", "sudadera", "sudaderas"
      ],
      category: "hoodies"
    },
    // Sweatshirts / crewnecks
    {
      match: [
        "sweatshirt", "sweatshirts", "crewneck", "jumper",
        "μπλούζα φούτερ", "μπλουζα φουτερ", "μπλούζες φούτερ", "μπλουζες φουτερ",
        "felpa girocollo", "maglia felpata",
        "sudadera sin capucha", "jersey"
      ],
      category: "sweatshirts"
    },
    // Tees / t‑shirts
    {
      match: [
        "tee", "tees", "t-shirt", "tshirt", "shirt",
        "μπλουζάκι", "μπλουζακι", "μπλουζάκια", "μπλουζακια", "μπλούζα", "μπλουζα", "μπλούζες", "μπλουζες",
        "maglietta", "t-shirt italiana",
        "camiseta", "camisetas"
      ],
      category: "tshirts"
    },
    // Tote bags
    {
      match: [
        "tote", "totes", "tote bag", "bag", "bags",
        "τσάντα", "τσαντα", "τσάντες", "τσαντες",
        "borsa", "borsa tote",
        "bolsa", "bolsas"
      ],
      category: "tote-bags"
    },
    // Hats / caps
    {
      match: [
        "hat", "hats", "cap", "caps", "baseball cap",
        "καπέλο", "καπελο", "καπέλα", "καπελα", "τζόκεϊ", "τζοκεϊ",
        "cappello", "cappelli",
        "gorra", "gorras"
      ],
      category: "hats"
    },
    // Mugs
    {
      match: [
        "mug", "mugs", "cup", "cups",
        "κούπα", "κουπα", "κούπες", "κουπες",
        "tazza", "tazze",
        "taza", "tazas"
      ],
      category: "mugs"
    }
  ];

  let detectedCategory = null;
  for (const entry of categoryMap) {
    if (entry.match.some((m) => q.includes(m))) {
      detectedCategory = entry.category;
      break;
    }
  }

  /* -----------------------------------------
     2) COLLECTION detection (EN/GR/IT/ES)
     -> returns your collection handles
  ----------------------------------------- */
  const collectionMap = [
    {
      match: [
        "sea & solidarity", "sea and solidarity", "safe passage", "solidarity",
        "θάλασσα", "θαλασσα", "θάλασσα & αλληλεγγύη", "θαλασσα & αλληλεγγυη",
        "ασφαλές πέρασμα", "ασφαλες περασμα", "αλληλεγγύη", "αλληλεγγυη",
        "mare e solidarietà", "passaggio sicuro", "solidarietà",
        "mar y solidaridad", "paso seguro", "solidaridad"
      ],
      collection: "sea-solidarity"
    },
    {
      match: [
        "ancient revival", "ancient", "mythology", "greek mythology",
        "αρχαίο ελληνικό", "αρχαιο ελληνικο", "αρχαία ελλάδα", "αρχαια ελλαδα", "μυθολογία", "μυθολογια",
        "antica grecia", "mitologia greca",
        "grecia antigua", "mitología griega"
      ],
      collection: "ancient-revival"
    },
    {
      match: [
        "voices of the med", "voices", "mediterranean voices",
        "φωνές της μεσογείου", "φωνες της μεσογειου",
        "voci del mediterraneo",
        "voces del mediterráneo"
      ],
      collection: "voices-med"
    },
    {
      match: [
        "blooming mediterranean", "pomegranate", "abundance", "blooming",
        "άνθιση", "ανθιση", "ρόδι", "ροδι", "αφθονία", "αφθονια",
        "abbondanza", "granada"
      ],
      collection: "blooming-med"
    },
    {
      match: [
        "mystic med", "protection symbol", "amulet", "spiritual",
        "μυστικό μεσογειακό", "μυστικο μεσογειακο", "φυλαχτό", "φυλαχτο",
        "mistico mediterraneo",
        "místico mediterráneo"
      ],
      collection: "mystic-med"
    },
    {
      match: [
        "spanishify", "latin", "latinx", "fiesta", "spanish heritage",
        "ισπανικό", "ισπανικο", "λατινικό", "λατινικο", "ισπανική κληρονομιά", "ισπανικη κληρονομια",
        "eredità ispanica", "herencia hispana"
      ],
      collection: "spanishify"
    },
    {
      match: [
        "italify", "italian", "italy", "italian heritage",
        "ιταλικό", "ιταλικο", "ιταλία", "ιταλια", "ιταλική κληρονομιά", "ιταλικη κληρονομια",
        "eredità italiana",
        "herencia italiana"
      ],
      collection: "italify"
    },
    {
      match: [
        "cyprify", "cyprus", "cypriot", "pomos", "cypriot icons",
        "κύπρος", "κυπρος", "κυπριακό", "κυπριακο",
        "cipro", "cipriota",
        "chipre", "chipriota"
      ],
      collection: "cyprify"
    },
    {
      match: [
        "greekify", "greek", "opa", "philoxenia", "hellenic",
        "ελληνικό", "ελληνικο", "ελληνική", "ελληνικη", "opa", "φιλοξενία", "φιλοξενια",
        "grecia", "greco",
        "grecia", "griego"
      ],
      collection: "greekify"
    }
  ];

  let detectedCollection = null;
  for (const entry of collectionMap) {
    if (entry.match.some((m) => q.includes(m))) {
      detectedCollection = entry.collection;
      break;
    }
  }

  /* -----------------------------------------
     3) SPECIAL BEHAVIOR / STYLE triggers
  ----------------------------------------- */
  if (
    q.includes("winter") || q.includes("warm") || q.includes("cold") ||
    q.includes("χειμ") || q.includes("ζεστ") || q.includes("κρύ") || q.includes("κρυ")
  ) {
    detectedCategory = detectedCategory || "hoodies";
  }

  if (
    q.includes("show me") || q.startsWith("δείξε") || q.startsWith("δειξε") ||
    q.includes("θέλω να δω") || q.includes("θελω να δω")
  ) {
    if (!detectedCategory && q.includes("hood")) detectedCategory = "hoodies";
    if (!detectedCategory && q.includes("sweat")) detectedCategory = "sweatshirts";
  }

  /* -----------------------------------------
     4) INTENT TYPE (for chat.js routing)
  ----------------------------------------- */
  let type = "generic";
  if (detectedCollection) type = "collection";
  else if (detectedCategory) type = "category";

  // very light "product" hint (keeps things safe)
  if (
    q.includes("product ") || q.includes("handle ") || q.includes("sku ") ||
    q.includes("προϊόν ") || q.includes("προιον ")
  ) {
    type = "product";
  }

  /* -----------------------------------------
     5) FINAL STRUCTURED QUERY
  ----------------------------------------- */
  return {
    raw: userText,
    type,                       // <- chat.js uses this
    category: detectedCategory, // e.g. "hoodies"
    collection: detectedCollection, // e.g. "sea-solidarity"
    semantic: q
  };
}


