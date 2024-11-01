import { Suspense } from "react";
import { listRegions, getCategoriesList, getCustomer } from "@lib/data";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import CartButton from "@modules/layout/components/cart-button";
import SideMenu from "@modules/layout/components/side-menu";
import AccountDropdown from "@modules/layout/components/account-dropdown";
import { Customer } from "@medusajs/medusa";
import "./Nav.css";

export default async function Nav() {
    const regions = await listRegions().then((regions) => regions);
    const { product_categories } = await getCategoriesList(0, 6);

    
    const customer = await getCustomer();
    // Extract only the top 5 parent categories
    const parentCategories = product_categories
        ? product_categories.filter((category) => category.parent_category === null).slice(0, 5)
        : [];

    return (
        <div className="sticky top-0 inset-x-0 z-50 group">
            <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
                <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
                    <div className="flex-1 basis-0 h-full flex items-center gap-x-3">
                        <div className="h-full">
                            <SideMenu regions={regions} />
                        </div>
                        <div className="flex items-center h-full">
                            <LocalizedClientLink
                                href="/"
                                className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
                                data-testid="nav-store-link"
                            >
                                <img
                                    src="/logo25.png"
                                    alt="Anikaa Logo"
                                    className="logo-image"
                                />
                            </LocalizedClientLink>
                        </div>
                    </div>

                    <div className="hidden small:flex items-center h-full gap-x-4">
                        {parentCategories.map((category) => (
                            <LocalizedClientLink
                                key={category.id}
                                href={`/explore/products/${category.handle}`}
                                className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"
                                data-testid={`nav-category-link-${category.id}`}
                            >
                                {category.name}
                            </LocalizedClientLink>
                        ))}
                    </div>

                    <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
                        {/* <div className="hidden small:flex items-center gap-x-6 h-full"> */}
                            {/* {process.env.FEATURE_SEARCH_ENABLED && (
                                <LocalizedClientLink
                                    className="hover:text-ui-fg-base"
                                    href="/explore/search"
                                    scroll={false}
                                    data-testid="nav-search-link"
                                >
                                    Search
                                </LocalizedClientLink>
                            )} */}
                            <LocalizedClientLink
                                className="hover:text-ui-fg-base"
                                href="/explore/account"
                                data-testid="nav-account-link"
                            >
                            <AccountDropdown customer={customer as Customer} />
                            </LocalizedClientLink>
                        {/* </div> */}
                        <Suspense
                            fallback={
                                <LocalizedClientLink
                                    className="hover:text-ui-fg-base flex gap-2"
                                    href="/explore/cart"
                                    data-testid="nav-cart-link"
                                >
                                    Cart (0)
                                </LocalizedClientLink>
                            }
                        >
                            <CartButton />
                        </Suspense>
                    </div>
                </nav>
            </header>
        </div>
    );
}
