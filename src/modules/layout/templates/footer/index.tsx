import { Text, clx } from "@medusajs/ui";
import { getCategoriesList, getCollectionsList } from "@lib/data";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import MedusaCTA from "@modules/layout/components/medusa-cta";
import "./FooterNav.css"; // Make sure to import your CSS file here

export default async function Footer() {
  const { collections } = await getCollectionsList(0, 6);
  const { product_categories } = await getCategoriesList(0, 6);

  return (
    <footer className="border-t border-ui-border-base w-full footer-container">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-screen-lg mx-auto">
            {/* {product_categories && product_categories?.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base footer-container font-avenir-bold">
                  Categories
                </span>
                <ul
                  className="grid grid-cols-1 gap-2 footer-container"
                  data-testid="footer-categories"
                >
                  {product_categories?.slice(0, 6).map((c) => {
                    if (c.parent_category) {
                      return null;
                    }

                    const children =
                      c.category_children?.map((child) => ({
                        name: child.name,
                        handle: child.handle,
                        id: child.id,
                      })) || null;

                    return (
                      <li className="flex flex-col gap-2 text-ui-fg-subtle txt-small" key={c.id}>
                        <LocalizedClientLink
                          className="footer-link font-avenir"
                          href={`/explore/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                        {children && (
                          <ul className="grid grid-cols-1 ml-3 gap-2">
                            {children.map((child) => (
                              <li key={child.id}>
                                <LocalizedClientLink
                                  className="footer-link font-avenir"
                                  href={`/explore/categories/${child.handle}`}
                                  data-testid="category-link"
                                >
                                  {child.name}
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )} */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="txt-small-plus txt-ui-fg-base font-avenir-bold">Collections</span>
                <ul
                  className={clx(
                    "grid grid-cols-1 gap-2 text-ui-fg-subtle txt-small",
                    {
                      "grid-cols-2": (collections?.length || 0) > 3,
                    }
                  )}
                >
                  {collections?.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="footer-link font-avenir"
                        href={`/explore/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
           <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base font-avenir-bold">FOR CLIENTS</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small font-avenir">
                <li>
                  <LocalizedClientLink
                    href="/policy/privacypolicy"
                    className="footer-link"
                  >
                    Privacy Policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/refundandcancellation"
                    className="footer-link"
                  >
                    Refund and cancellation Policy
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/shippinganddelivery"
                    className="footer-link"
                  >
                    Shipping and Delivery
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/termsandconditions"
                    className="footer-link"
                  >
                    Terms and Conditions
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/contact"
                    className="footer-link"
                  >
                    Ask a Question
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base font-avenir-bold">ABOUT COMPANY</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small font-avenir">
                <li>
                  <LocalizedClientLink href="/policy/careers" className="footer-link">
                    Careers
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/corporategiftsandspecialoccasions"
                    className="footer-link"
                  >
                    Corporate Gifts and Special Occasions
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/socialresponsibility"
                    className="footer-link"
                  >
                    Social Responsibility
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/tailormadecreativesolutions"
                    className="footer-link"
                  >
                    Tailormade creative solutions
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/policy/environmentalresponsibility"
                    className="footer-link"
                  >
                    Environmental Responsibility
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-y-2">
              <span className="txt-small-plus txt-ui-fg-base font-avenir-bold">CONTACTS</span>
              <ul className="grid grid-cols-1 gap-y-2 text-ui-fg-subtle txt-small font-avenir">
                <li>MAIN OFFICE</li>
                <li style={{ color: "#EE0A67", fontWeight: "bolder" }}>
                  (+91) 9362204990
                </li>
                <li>CUSTOMER SERVICE</li>
                <li style={{ color: "#713787", fontWeight: "bolder" }}>
                  <LocalizedClientLink
                    href="mailto:anikaadesignssolutions@gmail.com"
                    className="footer-link"
                  >
                    anikaadesignssolutions@gmail.com
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex w-full mb-16 gap-x-1 justify-between text-ui-fg-muted">
          <Text className="txt-small-plus font-avenir-bold">
            © {new Date().getFullYear()} Powered and secured by Anikaa Designs Solutions.
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  );
}
