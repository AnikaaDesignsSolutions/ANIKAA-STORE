// src/modules/layout/templates/footer-main/FooterContainer.tsx
import Footer from "./Footer";
import { getCategoriesList, getCollectionsList } from "@lib/data";

export default async function FooterContainer() {
  const { collections } = await getCollectionsList(0, 6);
  const { product_categories } = await getCategoriesList(0, 6);

  // Pass the fetched data as props to the Footer component
  return <Footer collections={collections} productCategories={product_categories} />;
}
