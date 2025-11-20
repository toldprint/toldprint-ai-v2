// lib/shopify.js

// -----------------------------------------------------------
// Shopify Storefront GraphQL Client
// -----------------------------------------------------------
// Fetches PUBLISHED products only (safe for public use)
// Requires env:
// SHOPIFY_DOMAIN
// SHOPIFY_STOREFRONT_TOKEN
// -----------------------------------------------------------
/* -------------------------------------------------------
   SHOPIFY CLIENT WITH VALIDATION
------------------------------------------------------- */

// Validate required environment variables
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

if (!SHOPIFY_STORE_DOMAIN) {
  throw new Error(
    "Missing environment variable: SHOPIFY_STORE_DOMAIN (e.g. pa7gm3-uy.myshopify.com)"
  );
}

if (!SHOPIFY_STOREFRONT_TOKEN) {
  throw new Error(
    "Missing environment variable: SHOPIFY_STOREFRONT_TOKEN (Storefront API Access Token)"
  );
}

// Base URL (no https:// duplication risk)
const SHOPIFY_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;

/* -------------------------------------------------------
   GRAPHQL CALLER
------------------------------------------------------- */

export async function shopifyQuery(query, variables = {}) {
  try {
    const res = await fetch(SHOPIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN
      },
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Shopify API Error:", err);
      throw new Error(`Shopify responded with ${res.status}`);
    }

    const json = await res.json();

    if (json.errors) {
      console.error("Shopify GraphQL errors:", json.errors);
      throw new Error("Shopify GraphQL query error");
    }

    return json.data;

  } catch (err) {
    console.error("shopifyQuery FAILED →", err);
    throw err;
  }
}

export async function shopifyQuery(query, variables = {}) {
  const endpoint = `https://${process.env.SHOPIFY_DOMAIN}/api/2024-01/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    console.error("Shopify error:", await res.text());
    return null;
  }

  const json = await res.json();
  return json.data;
}


// -----------------------------------------------------------
// Webhook signature validator placeholder (optional)
// -----------------------------------------------------------
export function verifyShopifyWebhook() {
  return true;
}
