export const config = {
  runtime: "nodejs"
};

import { put } from "@vercel/blob";
import { mergeSemanticIndex } from "../lib/semanticMerge.js";
import enrich from "../data/semantic-enrich.json" assert { type: "json" };

/**
 * Shopify Storefront API Client
 */
async function shopifyQuery(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  return json.data;
}

/**
 * GraphQL Query: ALL COLLECTIONS + PRODUCTS
 * (now includes featuredImage, productType, tags)
 */
const QUERY_ALL = `
  {
    collections(first: 50) {
      edges {
        node {
          id
          handle
          title
          description
          products(first: 200) {
            edges {
              node {
                id
                handle
                title
                description
                onlineStoreUrl
                productType
                tags
                featuredImage { url }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Normalize → Semantic Index (vNext)
 */
function normalizeToSemanticIndex(raw) {
  const collections = {};
  const products = {};

  raw.collections.edges.forEach(edge => {
    const col = edge.node;
    const cHandle = col.handle;

    // Collection entry
    collections[cHandle] = {
      id: cHandle,
      title: col.title,
      text: col.description || ""
    };

    // Products in this collection
    col.products.edges.forEach(pEdge => {
      const p = pEdge.node;

      const pid = `${cHandle}-product-${p.handle}`;

      products[pid] = {
        id: pid,
        handle: p.handle, // REAL Shopify handle
        title: p.title,
        url:
          p.onlineStoreUrl ||
          `https://toldprint.com/products/${p.handle}`,
        image: p.featuredImage?.url || "",
        collection: cHandle,
        productType: p.productType || "",
        tags: Array.isArray(p.tags) ? p.tags : [],
        text: p.description || ""
      };
    });
  });

  return {
    collections,
    products,
    lastUpdate: Date.now()
  };
}

/**
 * MAIN ENDPOINT
 */
export default async function handler(req, res) {
  try {
    const raw = await shopifyQuery(QUERY_ALL);

    if (!raw || !raw.collections) {
      return res.status(500).json({ error: "Shopify returned no data" });
    }

    // Build base semantic index from Shopify
    const semanticIndex = normalizeToSemanticIndex(raw);

    // Merge with enrichment layer (aliases, pages, keywords, etc.)
    const fullIndex = mergeSemanticIndex(semanticIndex, enrich);

    // Save merged index to Blob
    const putResult = await put(
      "semantic-index.json",
      JSON.stringify(fullIndex, null, 2),
      { access: "public" }
    );

    return res.status(200).json({
      status: "synced",
      blobUrl: putResult.url,
      products: Object.keys(fullIndex.products || {}).length,
      collections: Object.keys(fullIndex.collections || {}).length
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
