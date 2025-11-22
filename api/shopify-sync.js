// api/shopify-sync.js
import { put } from "@vercel/blob";
import { shopifyQuery } from "../../lib/shopify.js";

/**
 * ------------------------------------------------------------
 * TOLDPRINT AI — SHOPIFY SYNC ENDPOINT
 * ------------------------------------------------------------
 * Fetches all collections & products from Shopify
 * Converts them into semantic-index format
 * Saves semantic-index.json to Vercel Blob
 * ------------------------------------------------------------
 */

export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405
    });
  }

  try {
    /**
     * ------------------------------------------------------------
     * 1. FETCH ALL COLLECTIONS
     * ------------------------------------------------------------
     */
    const collectionsRes = await shopifyQuery(`
      {
        collections(first: 50) {
          edges {
            node {
              id
              handle
              title
              description
              image {
                url
              }
            }
          }
        }
      }
    `);

    const collections = collectionsRes.collections.edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      description: node.description || "",
      image: node.image?.url || null
    }));

    /**
     * ------------------------------------------------------------
     * 2. FETCH ALL PRODUCTS
     * ------------------------------------------------------------
     */
    const productsRes = await shopifyQuery(`
      {
        products(first: 250) {
          edges {
            node {
              id
              handle
              title
              description
              tags
              productType
              collections(first: 3) {
                edges {
                  node {
                    handle
                    title
                  }
                }
              }
              featuredImage {
                url
              }
              images(first: 10) {
                edges {
                  node {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `);

    const products = productsRes.products.edges.map(({ node }) => ({
      id: node.id,
      handle: node.handle,
      title: node.title,
      description: node.description || "",
      tags: node.tags,
      productType: node.productType,
      collections: node.collections.edges.map((c) => c.node.handle),
      featuredImage: node.featuredImage?.url || null,
      images: node.images.edges.map((i) => i.node.url)
    }));

    /**
     * ------------------------------------------------------------
     * 3. CREATE SEMANTIC INDEX OBJECT
     * ------------------------------------------------------------
     */
    const semanticIndex = {
      syncedAt: new Date().toISOString(),
      collections: {},
      products: {}
    };

    // Insert collections
    for (const c of collections) {
      semanticIndex.collections[c.handle] = {
        title: c.title,
        description: c.description,
        image: c.image
      };
    }

    // Insert products
    for (const p of products) {
      semanticIndex.products[p.handle] = {
        title: p.title,
        description: p.description,
        tags: p.tags,
        productType: p.productType,
        collections: p.collections,
        featuredImage: p.featuredImage,
        images: p.images
      };
    }

    /**
     * ------------------------------------------------------------
     * 4. SAVE TO VERCEL BLOB
     * ------------------------------------------------------------
     */
    const blobRes = await put("semantic-index.json", JSON.stringify(semanticIndex, null, 2), {
      access: "public"
    });

    return new Response(
      JSON.stringify({
        status: "synced",
        collections: collections.length,
        products: products.length,
        blobUrl: blobRes.url
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
        stack: err.stack
      }),
      { status: 500 }
    );
  }
}
