"use client";

import { Popover, Transition } from "@headlessui/react";
import { usePathname, useParams } from "next/navigation";
import { Fragment, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import { Customer } from "@medusajs/medusa";
import { signOut } from "@modules/account/actions";

type AccountDropdownProps = {
  customer: Customer | null; // Customer can be null if not logged in
};

const AccountDropdown = ({ customer }: AccountDropdownProps) => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false); // State to track hydration

  const open = () => setAccountDropdownOpen(true);
  const close = () => setAccountDropdownOpen(false);
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(undefined);

  const pathname = usePathname();
  const { countryCode } = useParams() as { countryCode: string };

  const handleLogout = async () => {
    console.log("clicked log out")
    const response = await signOut(countryCode);
    // console.log("response ",response)

  };

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer);
    }
    open();
  };

  const timedOpen = () => {
    open();
    const timer = setTimeout(close, 5000);
    setActiveTimer(timer);
  };

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer);
      }
    };
  }, [activeTimer]);

  // Set hydration state when component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // Don't render anything until hydrated
  }

  return (
    <div className="h-full z-50" onMouseEnter={openAndCancel} onMouseLeave={close}>
      <Popover className="relative h-full">
        <Popover.Button className="h-full relative">
          <div className="flex items-center gap-1 relative hover:text-ui-fg-base">
            <FontAwesomeIcon icon={faUser} className="text-xl" style={{ color: "black" }} />
            {customer ? (
              <span className="hidden small:block">Hi, {customer.first_name}</span>
            ) : (
              <LocalizedClientLink
                href="/explore/account"
                className="hidden small:block hover:text-ui-fg-base"
                data-testid="signup-login-link"
              >
                SIGN UP/LOGIN
              </LocalizedClientLink>
            )}
          </div>
        </Popover.Button>
        {customer && (
          <Transition
            show={accountDropdownOpen}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel
              static
              className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[300px] text-ui-fg-base rounded-lg shadow-lg"
              data-testid="nav-account-dropdown"
            >
              <div className="p-4 flex items-center justify-center">
                <h3 className="text-large-semi">
                  Welcome, {customer.first_name} {customer.last_name}
                </h3>
              </div>
              <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                <LocalizedClientLink
                  href="/explore/account/profile"
                  className="hover:text-ui-fg-base block"
                  data-testid="account-profile-link"
                >
                  My Profile
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/explore/account/orders"
                  className="hover:text-ui-fg-base block"
                  data-testid="account-orders-link"
                >
                  My Orders
                </LocalizedClientLink>
                <button
                  onClick={handleLogout}
                  className="hover:text-ui-fg-base block text-red-500 font-semibold"
                  data-testid="account-logout-link"
                >
                  Logout
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        )}
      </Popover>
    </div>
  );
};

export default AccountDropdown;
