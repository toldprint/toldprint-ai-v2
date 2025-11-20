// lib/products.js
import { shopifyQuery } from "./shopify.js";

/*
  Fetch ALL published products from the Shopify Storefront API.

  Returns:
  [
    {
      id,
      handle,
      title,
      url,
      tags,
      description,
      image,
      collections: [],
      variants: []
    }
  ]
*/

export async function fetchAllProducts() {
  const query = `
    query AllProducts {
      products(first: 100) {
        edges {
          node {
            id
            handle
            title
            description
            tags
            onlineStoreUrl
            featuredImage {
              url
            }
            collections(first: 10) {
              edges {
                node { title handle }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price { amount currencyCode }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyQuery(query);

  if (!data?.products?.edges) return [];

  return data.products.edges.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description || "",
    tags: node.tags || [],
    url: node.onlineStoreUrl,
    image: node.featuredImage?.url || null,
    collections: node.collections.edges.map(e => e.node),
    variants: node.variants.edges.map(e => e.node)
  }));
}

/*
  Lightweight keyword filter (title + description + tags + collections)
*/

export function keywordFilter(products, query) {
  const q = query.toLowerCase();

  return products.filter(p => {
    const fields = [
      p.title,
      p.description,
      p.tags.join(" "),
      p.collections.map(c => c.title).join(" ")
    ]
      .join(" ")
      .toLowerCase();

    return fields.includes(q);
  });
}
