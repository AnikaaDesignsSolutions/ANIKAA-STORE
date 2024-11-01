import { LineItem, Region } from "@medusajs/medusa";
import React from "react";
import { Table, Text } from "@medusajs/ui";
import LineItemOptions from "@modules/common/components/line-item-options";
import LineItemPrice from "@modules/common/components/line-item-price";
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price";
import Thumbnail from "@modules/products/components/thumbnail";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import Font Awesome
import { faBell } from "@fortawesome/free-solid-svg-icons"; // Import a reminder icon

type ItemProps = {
  item: Omit<LineItem, "beforeInsert">;
  region: Region;
};

const Item = ({ item, region }: ItemProps) => {
  // Access the material_design_data object
  const materialDesigns = item.material_design_data || {};

  return (
    <>
      {/* Iterate over materialDesigns object */}
      {Object.entries(materialDesigns).map(([designImageUrl, designData]: any, index: number) => (
        <React.Fragment key={`item-${item.id}-${index}`}>
          <Table.Row className="w-full" data-testid="product-row" style={{border:"none"}}>
            <Table.Cell className="!pl-0 p-4 w-24">
              <div className="flex w-16">
                {/* Use the material design image URL from the designImageUrl key */}
                <Thumbnail thumbnail={designImageUrl} size="square" />
              </div>
            </Table.Cell>

            <Table.Cell className="text-left">
              <Text className="txt-medium-plus text-ui-fg-base" data-testid="product-name">
                {item.title}
              </Text>
            </Table.Cell>

            {/* Display attach lining status */}
            <Table.Cell>
              <Text className="text-sm text-ui-fg-muted">
                {designData.attach_lining ? "Attach Lining" : "Don't Attach Lining"}
              </Text>
            </Table.Cell>

            <Table.Cell className="!pr-0">
              <span className="!pr-0 flex flex-col items-end h-full justify-center">
                <span className="flex gap-x-1">
                  <LineItemUnitPrice item={item} region={region} style="tight" />
                </span>
              </span>
            </Table.Cell>
          </Table.Row>

          {/* Add remainder row for measurement dress */}
          {designData.measurement_dress_images && designData.measurement_dress_images.length === 0 ? (
            <Table.Row >
              <td colSpan={4} className="p-4">
                <Text className="text-xs text-ui-fg-muted mt-1 flex items-center gap-1">
                  <FontAwesomeIcon
                    icon={faBell}
                    style={{ marginRight: "4px", fontSize: "0.8rem" }} // Adjust the icon size here
                  />
                  Don’t forget to send your measurement dress along with your material for the above item!
                </Text>
              </td>
            </Table.Row>
          ):(
            <Table.Row >

          </Table.Row>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default Item;
