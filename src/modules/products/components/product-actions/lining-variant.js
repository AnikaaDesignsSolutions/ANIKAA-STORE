import axios from 'axios';

// Define the backend URL
const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

// Function to fetch products and find variant ID of a product with "lining" in the title
export default async function fetchLiningVariantId() {
  try {
    // Make an API request to fetch all products
    const response = await axios.get(`${BACKEND_URL}/store/products`);

    // Get the product list from the response
    const products = response.data.products || [];

    // console.log("products ",products)
    // Find the product whose title contains "lining" (case-insensitive)
    const liningProduct = products.find((product) =>
      product.title.toLowerCase().includes('lining')
    );

    // If a lining product is found, return its first variant ID
    if (liningProduct) {
      return liningProduct.variants[0].id;
    }

    // If no product with "lining" in the title is found, return null
    return null;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products.");
  }
};
