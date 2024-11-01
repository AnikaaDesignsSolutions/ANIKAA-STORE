"use client";

import { Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import { Button } from "@medusajs/ui"; // Assuming you have a Button component in UI library
import { Modal, Box, IconButton } from "@mui/material";
import { isEqual } from "lodash";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useIntersection } from "@lib/hooks/use-in-view";
import { addToCart, retrieveCart, updateLineItem } from "@modules/cart/actions";
import Divider from "@modules/common/components/divider";
import OptionSelect from "@modules/products/components/option-select";
import { LineItem } from "@medusajs/medusa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import MobileActions from "../mobile-actions";
import ProductPrice from "../product-price";
import DesignPreferencesModal from "./DesignPreferencesModal";

import axios from "axios";
import { MEDUSA_BACKEND_URL } from "@lib/config";
import X from "@modules/common/icons/x";
import ImageCaptureModal from "./CameraUploadModal";


type ProductActionsProps = {
  product: PricedProduct;
  region: Region;
  disabled?: boolean;
};

export type PriceType = {
  calculated_price: string;
  original_price?: string;
  price_type?: "sale" | "default";
  percentage_diff?: string;
};

type LineItemWithDesign = {
  material_design_data?: Record<string, any>; // Define this according to your actual structure
} & LineItem; // Extending the existing LineItem type


export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [quantity, setQuantity] = useState(0); // Initialize quantity with 0
  const [modalOpen, setModalOpen] = useState(false); // Track if modal is open
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false); // Track delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState(false); // Track delete confirmation modal
  const [designModalOpen, setDesignModalOpen] = useState(false); // Track design preferences modal
  const [selectedMaterialImageUrl, setSelectedMaterialImageUrl] = useState<string | null>(null); // Track the selected material image URL
  const [quantityImages, setQuantityImages] = useState<Record<number, string>>(
    {}
  ); // Map quantity to images
  const [designPreferencesByImageUrl, setDesignPreferencesByImageUrl] = useState<
    Record<string, any>
  >({}); // Store design preferences by material image URL
  const [localChanges, setLocalChanges] = useState<boolean>(false); // Track if local changes are made
  const [matchingCategoryId, setMatchingCategoryId] = useState<string | null>(null);
  const [selectedDesignPreferences, setSelectedDesignPreferences] = useState<any>({});
  const [cart, setCart] = useState<any>(null);
  const [matchingItem, setMatchingItem] = useState<any>(null);
  const [selectedMaterialForDeletion, setSelectedMaterialForDeletion] = useState<string | null>(null); // Track the material to be deleted

  const [cartItem, setCartItem] = useState<any>(null);
  const countryCode = useParams().countryCode as string;
  const variants = product.variants;
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);



  // Initialize the option state
  useEffect(() => {
    const optionObj: Record<string, string> = {};

    for (const option of product.options || []) {
      Object.assign(optionObj, { [option.id]: undefined });
    }

    setOptions(optionObj);
  }, [product]);

  // Memoized record of the product's variants
  const variantRecord = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    for (const variant of variants) {
      if (!variant.options || !variant.id) continue;

      const temp: Record<string, string> = {};

      for (const option of variant.options) {
        temp[option.option_id] = option.value;
      }

      map[variant.id] = temp;
    }

    return map;
  }, [variants]);

  // Memoized function to check if the current options are a valid variant
  const variant = useMemo(() => {
    let variantId: string | undefined = undefined;

    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key;
      }
    }

    return variants.find((v) => v.id === variantId);
  }, [options, variantRecord, variants]);

  // If product only has one variant, then select it
  useEffect(() => {
    if (variants.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id]);
    }
  }, [variants, variantRecord]);

  const updateOptions = (update: Record<string, string>) => {
    setOptions({ ...options, ...update });
  };

  const inStock = useMemo(() => {
    if (variant && !variant.manage_inventory) {
      return true;
    }
    if (variant && variant.allow_backorder) {
      return true;
    }
    if (variant?.inventory_quantity && variant.inventory_quantity > 0) {
      return true;
    }
    return false;
  }, [variant]);

  const actionsRef = useRef<HTMLDivElement>(null);

  const inView = useIntersection(actionsRef, "0px");

  // Fetch product details for category ID
  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(
        `${MEDUSA_BACKEND_URL}/store/getCategoryId?id=${product.id}`
      );
      setMatchingCategoryId(response.data.categories[0].id);
    } catch (error) {
      console.error("Error fetching product details: ", error);
    }
  };

  useEffect(() => {
    fetchProductDetails(); // Fetch product details on component mount
  }, [product.id]);

// Fetch cart and design preferences, set quantity based on designPreferencesByImageUrl
useEffect(() => {
  const fetchAllDesignPreferences = async () => {
    const cartData = await retrieveCart();
    setCart(cartData);

    // Ensure cartData and items exist and check for variants
    if (cartData?.items && Array.isArray(cartData.items) && cartData.items.length > 0 && variants?.length > 0) {
      // Iterate over each variant to find matching items in the cart
      const updatedPreferences = { ...designPreferencesByImageUrl };

      variants.forEach((variant) => {
        const item = cartData.items.find((item: LineItemWithDesign) => item.variant_id === variant.id);

        // If a matching item is found and it contains material_design_data, update the preferences
        if (item && item.material_design_data) {
          Object.entries(item.material_design_data).forEach(([imageUrl, designData]) => {
            if (!updatedPreferences[imageUrl]) {
              updatedPreferences[imageUrl] = designData; // Update only if not already in local state
            }
          });
        }
      });

      // Set the updated design preferences
      setDesignPreferencesByImageUrl(updatedPreferences);
    }
  };

  if (!localChanges) {
    // Fetch the cart data only if no local changes have been made
    fetchAllDesignPreferences();
  }
}, [variants, localChanges]); // Run this effect whenever `variants` or `localChanges` changes


  // Update quantity based on the number of records in designPreferencesByImageUrl
  useEffect(() => {
    const quantityFromDesignPreferences = Object.keys(designPreferencesByImageUrl).length;

    // console.log("quantityFromDesignPreferences ",quantityFromDesignPreferences)
    setQuantity(quantityFromDesignPreferences); // Set quantity based on the number of entries
  }, [designPreferencesByImageUrl]); // Recalculate quantity whenever designPreferencesByImageUrl changes

  const handleButtonClick = () => {
    if (Object.keys(designPreferencesByImageUrl).length > 0) {
      // Navigate to the cart if designPreferencesByImageUrl is not empty
      router.push('/checkout');
    } else {
      // Otherwise, trigger the add to cart action
      handleIncreaseQuantity();
    }
  };
 
// console.log("cart ",cart)

const lineItemId = cart?.items.find((item: any) => item.variant_id === variant?.id);

const handleUploadImage = async (imageUrl: string) => {

      if (imageUrl) {

        // console.log("image url ",imageUrl)
        setQuantityImages((prev) => ({
          ...prev,
          [quantity]: imageUrl,
        }));

        setImageUrl(imageUrl);
        setModalOpen(false); // Close the modal after uploading the image
        setDesignModalOpen(true); // Open design preferences modal
        setSelectedMaterialImageUrl(imageUrl); // Track the material image URL associated with this upload
        setLocalChanges(true); // Mark that local changes have been made
      }
     
  };

  // Handle showing the modal when clicking the "+" button
  const handleIncreaseQuantity = () => {
    setModalOpen(true); // Show the modal when "+" button is clicked
  };

  // Decrease quantity and open delete material image modal
  const handleDecreaseQuantity = () => {
    setDeleteConfirmationOpen(true); // Show the delete confirmation modal
  };

  // console.log("designPreferencesByImageUrl ",designPreferencesByImageUrl)

  const openDeleteModal = async (materialImageUrl: string) => {
    if (!materialImageUrl) return;
    setDeleteConfirmation(true)
    setSelectedMaterialForDeletion(materialImageUrl);

  }
  // Handle material image deletion after confirmation
  const confirmDeleteQuantity = async () => {
    if (!selectedMaterialForDeletion) return;

    const designData = designPreferencesByImageUrl[selectedMaterialForDeletion];

    if (!designData) {
      // console.log("No design data found for the selected material image.");
      return;
    }

    console.log("selectedMaterialForDeletion ",selectedMaterialForDeletion)

    // console.log("designData ",designData)

    const designImages = designData?.design_images || [];
    const measurementDressImages = designData?.measurement_dress_images || []; // Include measurement dress images
    const allImagesForDeletion = [...designImages, ...measurementDressImages, selectedMaterialForDeletion]; // Include measurement dress images in deletion

  // Log the array of image URLs for deletion
  // console.log("Images for deletion:", allImagesForDeletion);

    
  const matchingCartItem = cart?.items?.find((item: LineItemWithDesign) => item.variant_id === variant?.id);
  const matchingItem = cart.items.find((item: LineItemWithDesign) => 
    item.material_design_data && item.material_design_data[selectedMaterialForDeletion]
  );

    // if (existsInCart) {
      // If the material image exists in cart, call API to delete
      try {
        // console.log("matchingCartItem?.id ", matchingCartItem?.id);
        // console.log("selectedMaterialForDeletion ", selectedMaterialForDeletion);

        // Use axios delete and pass the data using `data` field
        await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteMaterialImage`, {
          data: {
            id: matchingItem?.id,
            material_image_url: selectedMaterialForDeletion,
          },
        });

        // Update the cart after deletion
        let decreaseQuantity = matchingItem.quantity - 1;

        // console.log("delete designData.attach_lining ", designData.attach_lining);
        const message = await updateLineItem({
          lineId: matchingItem?.id,
          quantity: decreaseQuantity,
        })
          .catch((err) => {
            return err.message;
          })
          .finally(() => {
            // Remove from local state
            setDesignPreferencesByImageUrl((prev) => {
              const updatedPreferences = { ...prev };
              delete updatedPreferences[selectedMaterialForDeletion];
              return updatedPreferences;
            });
          });         

        // console.log(message);
      } catch (error) {
        console.error("Error deleting material image from cart:", error);
      }
    // } else {
      // If it's saved locally, remove it from local state

      await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteImage`, {
        data: {
          image_urls: allImagesForDeletion,
        },
      });
  
      // console.log("All images deleted from the database successfully.");

      setDesignPreferencesByImageUrl((prev) => {
        const updatedPreferences = { ...prev };
        delete updatedPreferences[selectedMaterialForDeletion];
        return updatedPreferences;
      });
    // }

    // Update quantity and close modal
    setQuantity((prev) => prev - 1);
    setDeleteConfirmationOpen(false); // Close the modal
    setDeleteConfirmation(false)
    setSelectedMaterialForDeletion(null); // Reset the selected material
  };

  const handleDesignPreferencesSubmit = (preferences: any) => {
    // Update the design preferences state for the selected material image URL
    setDesignPreferencesByImageUrl((prev) => ({
      ...prev,
      [selectedMaterialImageUrl!]: preferences,
    }));
    setDesignModalOpen(false); // Close the design preferences modal
    setLocalChanges(true); // Mark that local changes have been made
  };

  // Open design modal with data for the selected material image
  const handleOpenDesignModal = (materialImageUrl: string) => {
    setSelectedMaterialImageUrl(materialImageUrl);
    setDesignModalOpen(true); // Open the modal

    // Set database
    setSelectedDesignPreferences(designPreferencesByImageUrl[materialImageUrl]);
  };

  // console.log("designPreferencesByImageUrl ",designPreferencesByImageUrl)
  // console.log("out cartItem ",cartItem)

  // console.log("item id ",cart.items[0].id)
  return (
    <>
      <div className="flex flex-col gap-y-2">
        <div>
          {product.variants.length > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.id]}
                    updateOption={setOptions}
                    title={option.title}
                    disabled={!!disabled || isAdding}
                  />
                </div>
              ))}
              <Divider />
            </div>
          )}
          {variant && (variant.title==="With Lining") && (
   <p
   className="text-ui-fg-interactive bg-[#fdecea] border border-[#f5c6cb] p-4 rounded-lg text-small-semi text-center"
 >
   Please note: A ₹100 additional fee will be applied for the lining material. Make sure this option is selected only if necessary.
 </p>
  )}
        </div>
       <div className="flex flex-wrap gap-4">
  {Object.entries(designPreferencesByImageUrl).map(([materialImageUrl], index) => {
    // Check if the current materialImageUrl exists in the cart
    // console.log("cartItem ",cartItem)
    const existsInCart = variants.some((variant) => {
      const item = cart?.items?.find((cartItem: LineItemWithDesign) => cartItem.variant_id === variant.id);
      return item?.material_design_data?.[materialImageUrl];
    });

    const existsInCurrentCart = cartItem?.material_design_data?.[materialImageUrl];

    // console.log("cart ",cart)

    return (
      <div
        key={index}
        className="relative w-1/2 sm:w-1/3 md:w-1/4 mt-2"
      >
        {/* Material Image */}
        <img
          src={materialImageUrl}
          alt={`Material for ${materialImageUrl}`}
          className="w-full h-32 object-cover border" // Increased image height
          onClick={() => handleOpenDesignModal(materialImageUrl)} // Open design modal on image click
          style={{ cursor: "pointer" }}
        />

        {/* Cart Icon */}
        {/* {!existsInCart && !existsInCurrentCart && (
          <div
            className="absolute top-2 right-2 bg-white rounded-full p-1 flex items-center cursor-pointer hover:scale-110 transition-transform"
            onClick={() => handleSpecificMaterialAddToCart(materialImageUrl)}
            style={{ boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }} 
          >
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="shopping-cart text-lg transition-all duration-200" 
              style={{ color: "#EE0A67" }}
            />
            <span className="ml-2 text-xs text-gray-700">Add to Cart</span> 
          </div>
        )} */}

<div
            className="absolute top-2 right-2 bg-white rounded-full p-1 flex items-center cursor-pointer hover:scale-110 transition-transform"
            onClick={() => openDeleteModal(materialImageUrl)}
            style={{ boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }} 
          >
            <FontAwesomeIcon
              icon={faTrash}
              className="shopping-cart text-lg transition-all duration-200" 
              style={{ color: "#EE0A67" }}
            />
            {/* <span className="ml-2 text-xs text-gray-700">Remove from Cart</span>  */}
          </div>

        {/* In Cart / Not in Cart Status */}
        {/* {existsInCart || existsInCurrentCart ? (
          <p className="text-green-600 text-sm mt-2">In Cart</p>
        ) : (
          <p className="text-red-600 text-sm mt-2">Not in Cart</p>
        )} */}
      </div>
    );
  })}
</div>


        {/* Quantity Adjustment Section */}
        {variant && quantity > 0 && (
          <div className="flex gap-4 mt-4 mb-6">
            <div className="flex items-center justify-between border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={handleDecreaseQuantity}
                className="w-10 h-10 flex items-center justify-center bg-[#6e323b] hover:bg-[#56242e] text-white font-bold transition duration-200"
                disabled={isAdding}
              >
                -
              </button>
              <span className="w-12 h-10 flex items-center justify-center bg-white text-gray-800 text-xl font-semibold">
                {quantity}
              </span>
              <button
                onClick={handleIncreaseQuantity} // Open modal to upload image
                className="w-10 h-10 flex items-center justify-center bg-[#6e323b] hover:bg-[#56242e] text-white font-bold transition duration-200"
                disabled={isAdding} // Disable if an image is being uploaded
              >
                +
              </button>
            </div>
          </div>
        )}

        <ProductPrice product={product} variant={variant} region={region} />

{variant && (quantity > 0 )&& (
  <Button
  onClick={handleIncreaseQuantity}
  disabled={!variant || !!disabled || isAdding}
  variant="primary"
  className="w-full h-10 mt-3"
  isLoading={isAdding}
  style={{
    borderRadius: "0px",
    fontSize: "16px",
    textTransform: "uppercase",
    backgroundColor: "#e88b9a", // Mustard yellow for "Add to Cart"
  }}
>
  Customize a {product.title} now
</Button>
)}

        <Button
  onClick={handleButtonClick}
  disabled={!variant || !!disabled || isAdding}
  variant="primary"
  className="w-full h-10 mt-3"
  isLoading={isAdding}
  style={{
    borderRadius: "0px",
    fontSize: "16px",
    textTransform: "uppercase",
    backgroundColor:
      cart?.items && cart.items.length > 0
        ? "#6e323b" // Background color for "Checkout Now"
        : "#e88b9a", // Mustard yellow for "Add to Cart"
  }}
>
  {!variant
    ? "Select variant"
    : cart && cart?.items && cart.items.length > 0
    ? "Checkout Now"
    : "Add to Cart"}
</Button>




        {/* Design Preferences Modal */}
        {selectedMaterialImageUrl && (
          <DesignPreferencesModal
            isOpen={designModalOpen}
            onClose={() => setDesignModalOpen(false)}
            onSubmit={handleDesignPreferencesSubmit}
            categoryId={matchingCategoryId}
            lineItemId={lineItemId}
            productTitle={product.title}
            designPreferences={designPreferencesByImageUrl[selectedMaterialImageUrl!] || {}}
            materialImageUrl={selectedMaterialImageUrl} 
            variant={variant} 
          />
        )}

        {/* <MobileActions
          product={product}
          variant={variant}
          region={region}
          options={options}
          updateOptions={updateOptions}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        /> */}
      </div>

{/* Camera Upload Modal */}
<ImageCaptureModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productTitle={product.title ?? ""} // Provide a fallback string if product.title is undefined
        onUpload={handleUploadImage} // Get the uploaded image URL
      />


{/* Delete Confirmation Modal */}
<Modal open={deleteConfirmationOpen} onClose={() => setDeleteConfirmationOpen(false)} aria-labelledby="delete-confirmation-title">
  <Box
    sx={{
      width: { xs: '90vw', sm: '70vw', md: 450 }, // Adjust width based on screen size
      backgroundColor: "white",
      p: { xs: 2, md: 4 }, // Adjust padding for responsiveness
      margin: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      position: "relative",
      borderRadius: "12px", // Rounded corners for a smoother look
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Add a subtle shadow
    }}
  >
    <IconButton
      aria-label="close"
      onClick={() => setDeleteConfirmationOpen(false)}
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        color: 'gray',
      }}
    >
      <X />
    </IconButton>
    
    <h2 id="delete-confirmation-title" style={{
      textAlign: "center",
      marginBottom: "24px",
      fontSize: "1.5rem",
      fontWeight: "500",
      color: "#333",
    }}>
      Select Material Image for {product.title} to Delete
    </h2>

    <div
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        justifyContent: "center", // Center the images
      }}
    >
      {Object.entries(designPreferencesByImageUrl).map(([materialImageUrl], index) => (
        <div
          key={index}
          className="mt-2"
          onClick={() => setSelectedMaterialForDeletion(materialImageUrl)}
          style={{
            cursor: "pointer",
            border: selectedMaterialForDeletion === materialImageUrl ? "2px solid red" : "1px solid gray",
            borderRadius: "8px", // Add subtle rounding to the images
            padding: "8px",
            transition: "border 0.3s ease",
          }}
        >
          <img
            src={materialImageUrl}
            alt={`Material for ${materialImageUrl}`}
            className="w-24 h-24 object-cover"
            style={{
              borderRadius: "6px", // Slight rounding to image corners
            }}
          />
        </div>
      ))}
    </div>

    <Button
      variant="primary"
      color="error"
      onClick={confirmDeleteQuantity}
      className="responsive-button w-full mt-4" // Apply the responsive-button class
      style={{
        backgroundColor: '#b5021d',
        color: 'white',
        padding: "12px 0", // Better padding for the button
        fontSize: "1rem", // Adjust font size for better readability
        borderRadius: "6px", // Slight rounding for a modern button feel
        transition: "background-color 0.3s ease", // Add transition for hover effects
        // width: { xs: "100%", sm: "70%", md: "100%" }, // Responsive button width
      }}
      disabled={!selectedMaterialForDeletion} // Disable button if no material image is selected
    >
      Confirm Delete
    </Button>
  </Box>
</Modal>

<Modal
  open={deleteConfirmation}
  onClose={() => setDeleteConfirmation(false)}
  aria-labelledby="delete-confirmation-title"
>
  <Box
    sx={{
      width: { xs: '90vw', sm: '70vw', md: 450 },
      backgroundColor: "white",
      p: { xs: 2, md: 4 },
      margin: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      position: "relative",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    }}
  >
    <IconButton
      aria-label="close"
      onClick={() => setDeleteConfirmation(false)}
      sx={{
        position: 'absolute',
        right: 16,
        top: 16,
        color: 'gray',
      }}
    >
      <X />
    </IconButton>

    <h2 id="delete-confirmation-title" style={{
      textAlign: "center",
      marginBottom: "24px",
      fontSize: "1.5rem",
      fontWeight: "500",
      color: "#333",
    }}>
      Confirm Deletion
    </h2>

    {selectedMaterialForDeletion && (
      <div style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "16px",
      }}>
        <img
          src={selectedMaterialForDeletion}
          alt="Material to be deleted"
          style={{
            width: "80%",
            height: "auto",
            borderRadius: "8px",
          }}
        />
      </div>
    )}

    <div style={{
      display: "flex",
      gap: "16px",
      justifyContent: "center",
    }}>
      <Button
        variant="primary"
        color="error"
        onClick={confirmDeleteQuantity}
        style={{
          backgroundColor: '#b5021d',
          color: 'white',
          padding: "12px 24px",
          fontSize: "1rem",
          borderRadius: "6px",
        }}
      >
        Delete
      </Button>

      <Button
        variant="secondary"
        onClick={() => setDeleteConfirmation(false)}
        style={{
          borderColor: '#888',
          color: '#555',
          padding: "12px 24px",
          fontSize: "1rem",
          borderRadius: "6px",
        }}
      >
        Cancel
      </Button>
    </div>
  </Box>
</Modal>


      <style>
        {`
        div:hover .fa-shopping-cart {
  color: #000;
  transform: scale(1.1);
}
  .shopping-cart{
    color: green;

  }
    /* Add this to your CSS file or style block */
@media (max-width: 600px) {
  .responsive-button {
    width: 100%;
  }
}

@media (min-width: 600px) and (max-width: 960px) {
  .responsive-button {
    width: 70%;
  }
}

@media (min-width: 960px) {
  .responsive-button {
    width: 100%;
  }
}

`}
      </style>
    </>
  );
}
