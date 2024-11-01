"use client";

import { LineItem, Region } from "@medusajs/medusa";
import { Table, Text, clx, Button } from "@medusajs/ui";
import LineItemOptions from "@modules/common/components/line-item-options";
import LineItemPrice from "@modules/common/components/line-item-price";
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price";
import Thumbnail from "@modules/products/components/thumbnail";
import { updateLineItem } from "@modules/cart/actions";
import { Spinner, Trash } from "@medusajs/icons";
import { useState } from "react";
import ErrorMessage from "@modules/checkout/components/error-message";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import axios from "axios";
import { MEDUSA_BACKEND_URL } from "@lib/config";

type ItemProps = {
  item: Omit<LineItem, "beforeInsert">;
  region: Region;
  type?: "full" | "preview";
};

const Item = ({ item, region, type = "full" }: ItemProps) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMaterialImageUrl, setSelectedMaterialImageUrl] = useState<string | null>(null);

  const { handle } = item.variant.product;

  const changeQuantity = async (quantity: number) => {
    setError(null);
    setUpdating(true);

    const message = await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        return err.message;
      })
      .finally(() => {
        setUpdating(false);
      });

    message && setError(message);
  };

  // Access the material_design_data object
  const materialDesigns = item.material_design_data || {};

  const handleTrashClick = (designImageUrl: string) => {
    setSelectedMaterialImageUrl(designImageUrl); // Set the selected material image URL
    setModalOpen(true); // Open the confirmation modal
  };

  // console.log("item ",item)
  const handleConfirmDelete = async () => {
    console.log("Confirmed delete for cart id:", item.id);
    console.log("Confirmed delete for Material Image URL:", selectedMaterialImageUrl);
  
    try {
      // Delete the material image
      await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteMaterialImage`, {
        data: {
          id: item.id,
          material_image_url: selectedMaterialImageUrl,
        },
      });
  
      // Update the cart after deletion
      let decreaseQuantity = item.quantity - 1;
  
      const message = await updateLineItem({
        lineId: item.id,
        quantity: decreaseQuantity,
      }).catch((err) => {
        return err.message;
      });
  
      console.log("Update message:", message);
    } catch (error) {
      console.error("Error during deletion or update:", error);
    } finally {
      // Close the modal after confirmation
      setModalOpen(false);
    }
    
  };
  

  const handleCancelDelete = () => {
    setModalOpen(false); // Close the modal without confirmation
  };

  console.log("item ",item)

  return (
    <>
      {/* Iterate over materialDesigns object */}
      {Object.entries(materialDesigns).map(([designImageUrl, designData]: any, index: number) => (
        <Table.Row className="w-full" data-testid="product-row" key={`item-${item.id}-${index}`}>
          <Table.Cell className="!pl-0 p-4 w-24">
            <LocalizedClientLink
              href={`/explore/products/${handle}`}
              className={clx("flex", {
                "w-16": type === "preview",
                "small:w-24 w-12": type === "full",
              })}
            >
              {/* Use the material design image URL from the designImageUrl key */}
              <Thumbnail thumbnail={designImageUrl} size="square" />
            </LocalizedClientLink>
          </Table.Cell>

          <Table.Cell className="text-left">
            <LocalizedClientLink href={`/explore/products/${handle}`}>
              <Text className="txt-medium-plus text-ui-fg-base" data-testid="product-title">
                {item.title}
              </Text>
            </LocalizedClientLink>
            {/* <LocalizedClientLink href={`/explore/products/${handle}`}>
              <LineItemOptions variant={item.variant} data-testid="product-variant" />
            </LocalizedClientLink> */}
          </Table.Cell>

          {/* Full view: Display attach lining status */}
          {type === "full" && (
            <Table.Cell>
              <Text className="text-sm text-ui-fg-muted">
                {designData.attach_lining ? "Yes" : "No"}
              </Text>
            </Table.Cell>
          )}
            {type === "preview" && (
            <Table.Cell>
              <Text className="text-sm text-ui-fg-muted">
                {designData.attach_lining ? "Attach Lining" : "Dont attach Lining"}
              </Text>
            </Table.Cell>
          )}
          

          {/* Full view: Delete button */}
          {type === "full" && (
            <Table.Cell>
              <div className="flex flex-col items-start">
                <button
                  className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
                  onClick={() => handleTrashClick(designImageUrl)} // Log the designImageUrl on click
                >
                  <Trash />
                </button>
                {updating && <Spinner />}
              </div>
              <ErrorMessage error={error} data-testid="product-error-message" />
            </Table.Cell>
          )}

          {/* Full view: Display price */}
          {type === "full" && (
            <Table.Cell className="small:table-cell">
              <LineItemUnitPrice item={item} region={region} style="tight" />
            </Table.Cell>
          )}

<Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              {/* <Text className="text-ui-fg-muted">{item.quantity}x </Text> */}
              <LineItemUnitPrice item={item} region={region} style="tight" />
            </span>
          )}
          {/* <LineItemPrice item={item} region={region} style="tight" /> */}
        </span>
      </Table.Cell>

        </Table.Row>
      ))}

   
      {/* Delete Confirmation Modal */}
      <Modal
  open={modalOpen}
  onClose={handleCancelDelete}
  aria-labelledby="modal-title"
>
  <Box
    sx={{
      width: { xs: "90vw", sm: "70vw", md: 400 },
      backgroundColor: "white",
      p: { xs: 2, md: 4 },
      margin: "auto",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)", // Center the modal horizontally and vertically
      position: "absolute",
      borderRadius: "12px", // Rounded corners
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
    }}
  >
    <h2
      id="modal-title"
      style={{
        textAlign: "center",
        marginBottom: "16px",
        fontSize: "1.4rem",
        fontWeight: "600", // Enhance the font weight
        color: "#333", // Use a darker text color
      }}
    >
      Confirm Delete
    </h2>
    <p style={{ textAlign: "center", marginBottom: "14px", fontSize: "0.95rem", color: "#555" }}>
      Are you sure you want to delete this material image?
    </p>

    {selectedMaterialImageUrl && (
  <div style={{ textAlign: "center", marginBottom: "16px" }}>
    <img
      src={selectedMaterialImageUrl}
      alt="Material to be deleted"
      style={{
        display: "inline-block", // Center the image horizontally
        width: "100%",
        maxWidth: "180px", // Reduced size of the image
        height: "auto",
        borderRadius: "8px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)", // Subtle shadow around the image
      }}
    />
  </div>
)}

    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "15px", // Reduced spacing between the buttons
      }}
    >
      <Button
        onClick={handleCancelDelete}
        variant="secondary"
        style={{
          padding: "8px 16px", // Reduced padding
          fontSize: "0.9rem",   // Reduced font size
          minWidth: "100px",    // Smaller button size
          borderRadius: "6px",  // Rounded corners for the button
        }}
      >
        Cancel
      </Button>
      <Button
        onClick={handleConfirmDelete}
        variant="primary"
        style={{
          backgroundColor: '#b5021d',
          color: 'white',
          padding: "8px 16px", // Reduced padding
          fontSize: "0.9rem",   // Reduced font size
          minWidth: "100px",    // Smaller button size
          borderRadius: "6px",  // Same rounded corners for consistency
        }}
      >
        Confirm Delete
      </Button>
    </div>
  </Box>
</Modal>

    </>
  );
};

export default Item;


