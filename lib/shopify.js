// lib/shopify.js

export async function shopifyQuery(query, variables = {}) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain) {
    throw new Error("Missing env SHOPIFY_STORE_DOMAIN");
  }
  if (!token) {
    throw new Error("Missing env SHOPIFY_STOREFRONT_TOKEN");
  }

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("SHOPIFY ERROR:", errorText);
    throw new Error(`Shopify API error: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}
