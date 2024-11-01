import { Order } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { formatAmount } from "@lib/util/prices"

type OrderCardProps = {
  order: Omit<Order, "beforeInsert">
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return order.items.reduce((acc, item) => {
      return acc + item.quantity
    }, 0)
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items.length
  }, [order])

  return (
    <div className="bg-white flex flex-col" data-testid="order-card">
      <div className="uppercase text-large-semi mb-1">
        #<span data-testid="order-display-id">{order.display_id}</span>
      </div>
      <div className="flex items-center divide-x divide-gray-200 text-small-regular text-ui-fg-base">
        <span className="pr-2" data-testid="order-created-at">
          {new Date(order.created_at).toDateString()}
        </span>
        <span className="px-2" data-testid="order-amount">
          {formatAmount({
            amount: order.total,
            region: order.region,
            includeTaxes: false,
          })}
        </span>
        <span className="pl-2">{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"}`}</span>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 my-4">
        {order.items.slice(0, 3).map((i) => {
          const designData = i.material_design_data;
          const designDataKeys = designData ? Object.keys(designData) : []; // Ensure designData is defined
          const maxDesignsToShow = 3;
          const displayedDesigns = designDataKeys.slice(0, maxDesignsToShow); // Display only first 4
          const hiddenDesignsCount = designDataKeys.length - maxDesignsToShow;

          return (
            <div key={i.id} className="flex flex-col gap-y-2" data-testid="order-item">
              <div className="flex flex-col gap-x-4 sm:flex-row sm:gap-y-4">
                {/* Iterate over the limited number of designData items */}
                {displayedDesigns.map((imageUrl, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {/* Display the image thumbnail */}
                    <Thumbnail thumbnail={imageUrl} images={[]} size="small" />

                    {/* Display attach_lining information */}
                    <div className="text-small-regular text-ui-fg-base mt-1">
                      <span className="text-small-regular text-ui-fg-base font-semibold" data-testid="item-title">
                        {designData && designData[imageUrl]?.attach_lining
                          ? "Attached Lining: Yes"
                          : "Attached Lining: No"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* If there are more than 4 designs, display the hidden count */}
              {hiddenDesignsCount > 0 && (
                <div className="text-small-regular text-ui-fg-base mt-2">
                  + {hiddenDesignsCount} more
                </div>
              )}

              <div className="flex items-center text-small-regular text-ui-fg-base mt-2">
                <span className="text-ui-fg-base font-semibold" data-testid="item-title">
                  {i.title}
                </span>
                <span className="ml-2">x</span>
                <span data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <LocalizedClientLink href={`/explore/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary" className="btn-custom hover:text-black">
            See details
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
