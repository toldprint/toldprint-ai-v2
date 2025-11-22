/**
 * SAFE Shopify Storefront Client for Vercel Edge/NodeJS
 * No undici, no fastify, no Node built-in modules.
 */

export async function shopifyQuery(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  if (!token) throw new Error("Missing SHOPIFY_STOREFRONT_TOKEN");

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Shopify API error: " + text);
  }

  const json = await res.json();
  return json.data;
}

