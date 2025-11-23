// lib/queryClassifier.js

/**
 * ============================================================
 *  TOLDPRINT AI — Query Classifier (v2.1 triggers patch)
 *  Converts user text → structured search intent
 *  Patch: expands triggers only (EN/GR/IT/ES) for:
 *  • categories
 *  • collections / styles
 *  • seasonal/style hints
 * ============================================================
 */

export function classifyQuery(userText) {
  const q = userText.toLowerCase().trim();

  /* -----------------------------------------
     1) CATEGORY detection
  ----------------------------------------- */
  const categoryMap = [
    {
      match: [
        // EN
        "hoodie", "hoodies", "hooded", "pullover hoodie",
        // GR
        "φούτερ", "φουτερ", "hoodie φούτερ",
        // IT
        "felpa", "felpe", "felpa con cappuccio",
        // ES
        "sudadera", "sudaderas", "sudadera con capucha"
      ],
      category: "hoodies"
    },
    {
      match: [
        // EN
        "sweatshirt", "sweatshirts", "crewneck", "jumper", "pullover",
        // GR
        "μπλούζα φούτερ", "μπλουζα φουτερ", "φούτερ χωρίς κουκούλα", "crewneck",
        // IT
        "girocollo", "felpa girocollo",
        // ES
        "sudadera sin capucha", "cuello redondo"
      ],
      category: "sweatshirts"
    },
    {
      match: [
        // EN
        "tote", "tote bag", "totes", "bag", "bags",
        // GR
        "τσάντα", "τσαντα", "τσάντες", "τσαντες", "tote",
        // IT
        "borsa", "borsa tote", "shopper",
        // ES
        "bolsa", "bolsa tote", "bolso"
      ],
      category: "tote-bags"
    },
    {
      match: [
        // EN
        "tee", "tees", "t-shirt", "tshirt", "shirt", "shirts",
        // GR
        "μπλουζάκι", "μπλουζακι", "μπλουζάκια", "μπλουζακια",
        // IT
        "maglietta", "t-shirt",
        // ES
        "camiseta", "playera"
      ],
      category: "tshirts"
    },
    {
      match: [
        // EN
        "hat", "hats", "cap", "caps", "beanie",
        // GR
        "καπέλο", "καπελο", "καπέλα", "καπελα", "σκουφί",
        // IT
        "cappello", "berretto",
        // ES
        "gorra", "sombrero", "gorro"
      ],
      category: "hats"
    },
    {
      match: [
        // EN
        "mug", "mugs", "cup", "cups",
        // GR
        "κούπα", "κουπα", "κούπες", "κουπες",
        // IT
        "tazza", "tazze",
        // ES
        "taza", "tazas"
      ],
      category: "mugs"
    }
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
    {
      match: [
        // EN
        "sea & solidarity", "sea and solidarity", "solidarity", "safe passage",
        "refugee", "rescue", "human rights", "dignity afloat",
        "nautical", "sea", "marine", "sailing", "ocean",
        // GR
        "sea & solidarity", "αλληλεγγύη", "αλληλεγγυη", "ασφαλές πέρασμα", "ασφαλες περασμα",
        "προσφυγικό", "προσφυγικο", "διάσωση", "διασωση", "ανθρώπινα δικαιώματα", "ανθρωπινα δικαιωματα",
        "θάλασσα", "θαλασσα", "ναυτικό", "ναυτικο", "ωκεανός", "ωκεανος",
        // IT
        "mare e solidarietà", "passaggio sicuro", "solidarietà", "diritti umani", "nautico", "mare",
        // ES
        "mar y solidaridad", "paso seguro", "solidaridad", "derechos humanos", "náutico", "mar"
      ],
      collection: "sea-solidarity"
    },
    {
      match: [
        // EN
        "ancient revival", "ancient greek", "ancient greece", "greek mythology",
        "mythology", "classical", "classical greece", "ancient symbols",
        "medusa", "owl", "labyrinth",
        // GR
        "ancient revival", "αρχαίο ελληνικό", "αρχαιο ελληνικο", "αρχαία ελλάδα", "αρχαια ελλαδα",
        "ελληνική μυθολογία", "ελληνικη μυθολογια", "μυθολογία", "μυθολογια",
        "κλασικό ελληνικό", "κλασικο ελληνικο", "αρχαία σύμβολα", "αρχαια συμβολα",
        "μέδουσα", "μεδουσα", "κουκουβάγια", "κουκουβαγια", "λαβύρινθος", "λαβυρινθος",
        // IT
        "grecia antica", "mitologia greca", "grecia classica", "simboli antichi", "medusa", "gufo", "labirinto",
        // ES
        "grecia antigua", "mitología griega", "grecia clásica", "símbolos antiguos", "medusa", "búho", "laberinto"
      ],
      collection: "ancient-revival"
    },
    {
      match: [
        // EN
        "voices of the med", "voices", "mediterranean voices", "med", "mediterranean",
        "unity", "equality", "community", "rights for all",
        // GR
        "voices of the med", "φωνές της μεσογείου", "φωνες της μεσογειου",
        "μεσόγειος", "μεσογειος", "ενότητα", "ενοτητα", "ισότητα", "ισοτητα", "κοινότητα", "κοινοτητα",
        // IT
        "voci del mediterraneo", "mediterraneo", "unità", "uguaglianza", "comunità",
        // ES
        "voces del mediterráneo", "mediterráneo", "unidad", "igualdad", "comunidad"
      ],
      collection: "voices-med"
    },
    {
      match: [
        // EN
        "blooming mediterranean", "blooming", "pomegranate", "abundance", "flora",
        // GR
        "άνθιση μεσογείου", "ανθιση μεσογειου", "blooming mediterranean",
        "ρόδι", "ροδι", "αφθονία", "αφθονια", "λουλούδια", "λουλουδια",
        // IT
        "fioritura mediterranea", "melograno", "abbondanza", "flora",
        // ES
        "floración mediterránea", "granada", "abundancia", "flora"
      ],
      collection: "blooming-med"
    },
    {
      match: [
        // EN
        "mystic med", "mystic mediterranean", "protection symbol", "spiritual", "amulet",
        // GR
        "μυστική μεσόγειος", "μυστικη μεσογειος", "mystic med",
        "σύμβολο προστασίας", "συμβολο προστασιας", "προστασία", "προστασια",
        // IT
        "mistico mediterraneo", "simbolo di protezione", "spirituale",
        // ES
        "místico mediterráneo", "símbolo de protección", "espiritual"
      ],
      collection: "mystic-med"
    },
    {
      match: [
        // EN
        "spanishify", "spanish", "latin", "latin vibes", "fiesta", "españa", "spain",
        // GR
        "spanishify", "ισπανικό", "ισπανικο", "ισπανία", "ισπανια", "fiesta",
        // IT
        "spanishify", "spagnolo", "spagna", "fiesta",
        // ES
        "spanishify", "español", "españa", "fiesta"
      ],
      collection: "spanishify"
    },
    {
      match: [
        // EN
        "italify", "italian", "italy", "italia",
        // GR
        "italify", "ιταλικό", "ιταλικο", "ιταλία", "ιταλια",
        // IT
        "italify", "italiano", "italia",
        // ES
        "italify", "italiano", "italia"
      ],
      collection: "italify"
    },
    {
      match: [
        // EN
        "cypriot", "cyprus", "cyprify", "pomos",
        // GR
        "κυπριακό", "κυπριακο", "κύπρος", "κυπρος", "cyprify", "πόμος", "πομος",
        // IT
        "cipro", "cyprify", "pomos",
        // ES
        "chipre", "cyprify", "pomos"
      ],
      collection: "cypriot-icons"
    },
    {
      match: [
        // EN
        "greekify", "greek", "opa", "philoxenia", "hellenic", "greece",
        // GR
        "greekify", "ελληνικό", "ελληνικο", "ελλάδα", "ελλαδα", "όπα", "οπα", "φιλοξενία", "φιλοξενια",
        // IT
        "greekify", "greco", "opa", "filoxenia", "grecia",
        // ES
        "greekify", "griego", "opa", "filoxenia", "grecia"
      ],
      collection: "greekify"
    }
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
    q.includes("winter") || q.includes("warm") || q.includes("cold") ||
    q.includes("χειμ") || q.includes("ζεστ") || q.includes("κρύ") ||
    q.includes("inverno") || q.includes("caldo") || q.includes("freddo") ||
    q.includes("invierno") || q.includes("cálido") || q.includes("frío")
  ) {
    detectedCategory = detectedCategory || "hoodies";
  }

  if (q.includes("show me") || q.includes("δείξε μου") || q.includes("δειξε μου")) {
    if (!detectedCategory && q.includes("hood")) detectedCategory = "hoodies";
    if (!detectedCategory && (q.includes("sweat") || q.includes("crew"))) detectedCategory = "sweatshirts";
    if (!detectedCategory && (q.includes("φούτερ") || q.includes("φουτερ"))) detectedCategory = "hoodies";
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
