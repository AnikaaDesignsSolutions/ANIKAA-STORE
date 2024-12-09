"use client"

import { PricedProduct } from "@medusajs/medusa/dist/types/pricing"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import PrivacyAndDataPolicy from "@modules/common/icons/PrivacyAndDataPolicy"
import DataDeletionPolicy from "@modules/common/icons/DataDeletionPolicy"
import Accordion from "./accordion"

type ProductTabsProps = {
  product: PricedProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const tabs = [
    {
      label: "Privacy Policy",
      component: <PrivacyPolicyTab />,
    },
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const PrivacyPolicyTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        {/* Privacy Information Section */}
        <div className="flex items-start gap-x-2">
          <PrivacyAndDataPolicy />
          <div>
            <span className="font-semibold">
              Privacy and Data Policy
            </span>
            <p className="max-w-sm">
              We value your privacy and take the utmost care to handle your personal data responsibly.
            </p>
          </div>
        </div>

        {/* Audio/Video and Design Data Deletion Policy */}
        <div className="flex items-start gap-x-2">
          <DataDeletionPolicy />
          <div>
            <span className="font-semibold">Data Deletion Policy</span>
            <p className="max-w-sm">
              Any audios, videos, design details, or material images provided by you during the order process will be securely deleted from our systems once your completely stitched dress is delivered. 
              This ensures your personal data is handled with the highest regard for your privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Fast delivery</span>
            <p className="max-w-sm">
              Your package will arrive in 5-7 business days at your pick up
              location or in the comfort of your home.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Easy returns</span>
            <p className="max-w-sm">
            If the delivered product does not fit correctly, you can resend the dress with the corrected measurements. Resizing will be done wherever possible to ensure the dress fits as per your updated specifications. 
              Please note that resizing can only be done once, and you will be responsible for paying the delivery charges for returning the dress and receiving it back after resizing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
