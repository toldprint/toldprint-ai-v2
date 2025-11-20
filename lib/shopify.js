// lib/shopify.js

// -----------------------------------------------------------
// Shopify Storefront GraphQL Client
// -----------------------------------------------------------
// Fetches PUBLISHED products only (safe for public use)
// Requires env:
// SHOPIFY_DOMAIN
// SHOPIFY_STOREFRONT_TOKEN
// -----------------------------------------------------------

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
