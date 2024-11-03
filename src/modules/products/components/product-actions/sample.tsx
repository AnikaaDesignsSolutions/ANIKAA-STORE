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

import MobileActions from "../mobile-actions";
import ProductPrice from "../product-price";
import DesignPreferencesModal from "./DesignPreferencesModal";

import axios from "axios";
import { MEDUSA_BACKEND_URL } from "@lib/config";
import X from "@modules/common/icons/x";
import ImageCaptureModal from "./CameraUploadModal";
import fetchLiningVariantId from './lining-variant';


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
  const [liningVariantId, setLiningVariantId] = useState<string | null>(null); // Track lining variant ID

  const [cartItem, setCartItem] = useState<any>(null);
  const countryCode = useParams().countryCode as string;
  const variants = product.variants;
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const getLiningVariantId = async () => {
      try {
        const liningVariantId = await fetchLiningVariantId();
        // console.log("liningVariantId ",liningVariantId)
        setLiningVariantId(liningVariantId)
      } catch (error) {
        console.error("Error fetching lining variant ID:", error);
      }
    };

    getLiningVariantId();
  }, []);



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
// Fetch cart and design preferences, set quantity based on designPreferencesByImageUrl
useEffect(() => {
  const fetchCart = async () => {
    const cartData = await retrieveCart();
    setCart(cartData);

    // Ensure that cartData and items exist and check for variant
    if (cartData?.items && Array.isArray(cartData.items) && cartData.items.length > 0 && variants?.length === 1 && variants[0].id) {
      const item = cartData.items.find((item: LineItemWithDesign) => item.variant_id === variants[0].id);

      setCartItem(item);
      if (item && item.material_design_data) {
        setDesignPreferencesByImageUrl((prev) => {
          const updatedPreferences = { ...prev };
          
          // Check if material_design_data is defined before using Object.entries
          if (item.material_design_data) {
            Object.entries(item.material_design_data).forEach(([imageUrl, designData]) => {
              if (!prev[imageUrl]) {
                updatedPreferences[imageUrl] = designData; // Update only if not already in local state
              }
            });
          }
      
          return updatedPreferences;
        });
      }
      
    }
  };

  if (!localChanges) {
    // Fetch the cart data only if no local changes have been made
    fetchCart();
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
      handleAddToCart();
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0 || Object.keys(quantityImages).length === 0) {
      setModalOpen(true);
      return;
    }
  
    if (!variant?.id) return null;
  
    setIsAdding(true);
  
    await addToCart({
      variantId: variant.id,
      quantity: 1,
      countryCode,
    });
  
    const updatedCart = await retrieveCart();
  
    // Ensure updatedCart is not null before proceeding
    if (updatedCart && updatedCart.items) {
      setCart(updatedCart);
  
      const updatedMatchingItem = updatedCart.items.find((item: any) => item.variant_id === variant.id);
      setMatchingItem(updatedMatchingItem);
  
      // Call API to update design preferences with matchingItem.id
      if (updatedMatchingItem && designPreferencesByImageUrl) {
        for (const [materialImageUrl, designData] of Object.entries(designPreferencesByImageUrl)) {
          const postData = {
            id: updatedMatchingItem.id,
            material_image_url: materialImageUrl,
            design_preference: designData.design_preference,
            design_images: designData.design_images,
            measurement_dress_images: designData.measurement_dress_images,
            measurement_values: designData.measurement_values,
            attach_lining: designData.attach_lining, // Add attach_lining value here
            design_preference_audio: designData.design_preference_audio, // Add audio URL to postData
            design_preference_video: designData.design_preference_video,
          };

          try {
            await axios.post(`${MEDUSA_BACKEND_URL}/store/customizeDesign`, postData);
            // console.log("Design preferences updated successfully for", materialImageUrl);
          } catch (error) {
            console.error("Error updating design preferences:", error);
          }
        }
      }
    } else {
      console.error("Cart is null or has no items.");
    }
  
    setIsAdding(false);
  };
  

  const handleSpecificMaterialAddToCart = async (materialImageUrl: string) => {
    if (!variant?.id) return null;
  
    setIsAdding(true);
  
    // Add the specific variant to the cart
    await addToCart({
      variantId: variant.id,
      quantity: 1,
      countryCode,
    });
  
    const updatedCart = await retrieveCart();
    setCart(updatedCart);
  
    // Check if updatedCart is not null before accessing its items
    if (updatedCart && updatedCart.items) {
      const updatedMatchingItem = updatedCart.items.find((item: any) => item.variant_id === variant.id);
      setMatchingItem(updatedMatchingItem);
  
      // Check if the selected material is in the design preferences
      const designData = designPreferencesByImageUrl[materialImageUrl];
  
      if (updatedMatchingItem && designData) {
        const postData = {
          id: updatedMatchingItem.id,
          material_image_url: materialImageUrl,
          design_preference: designData.design_preference,
          design_images: designData.design_images,
          measurement_dress_images: designData.measurement_dress_images,
          measurement_values: designData.measurement_values,
          attach_lining: designData.attach_lining,
          design_preference_audio: designData.design_preference_audio,
          design_preference_video: designData.design_preference_video
        };
  
        console.log("addToCart attach_lining ",designData.attach_lining)
        console.log("liningVariantId ",liningVariantId)
        console.log("cart id ",cart.id)
        try {
          await axios.post(`${MEDUSA_BACKEND_URL}/store/customizeDesign`, postData);
          // console.log("Design preferences updated successfully for", materialImageUrl);
  
          if (designData.attach_lining && liningVariantId) {
            await axios.post(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items`, {
              variant_id: liningVariantId,
              quantity: 1,
            });
  
            console.log("Lining variant added to the cart successfully");
          }
          // Update the local cartItem state immediately after adding to the cart
          setCartItem((prevCartItem: LineItemWithDesign | null) => {
            const updatedCartItem = { ...prevCartItem };
  
            // Add the new materialImageUrl to material_design_data in cartItem
            if (!updatedCartItem.material_design_data) {
              updatedCartItem.material_design_data = {};
            }
            updatedCartItem.material_design_data[materialImageUrl] = designData;
  
            return updatedCartItem;
          });
        } catch (error) {
          console.error("Error updating design preferences:", error);
        }
      }
    } else {
      console.error("Updated cart is null or does not contain items.");
    }
  
    setIsAdding(false);
  };
  

console.log("cart ",cart)

const lineItemId = cart?.items.find((item: any) => item.variant_id === variant?.id);

  // const handleUploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;
  //   setUploading(true);
  //   const formData = new FormData();
  //   formData.append("image", file);
  //   try {
  //     const response = await fetch(
  //       `${MEDUSA_BACKEND_URL}/store/designImageUpload`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     const data = await response.json();
  //     if (data?.files?.image?.[0]?.url) {
  //       setQuantityImages((prev) => ({
  //         ...prev,
  //         [quantity]: data.files.image[0].url,
  //       }));

  //       setImageUrl(data.files.image[0].url);
  //       setModalOpen(false); // Close the modal after uploading the image
  //       setDesignModalOpen(true); // Open design preferences modal
  //       setSelectedMaterialImageUrl(data.files.image[0].url); // Track the material image URL associated with this upload
  //       setLocalChanges(true); // Mark that local changes have been made
  //     }
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleUploadImage = async (imageUrl: string) => {
    // const file = event.target.files?.[0];
    // if (!file) return;
    // setUploading(true);
    // const formData = new FormData();
    // formData.append("image", file);
    // try {
    //   const response = await fetch(
    //     `${MEDUSA_BACKEND_URL}/store/designImageUpload`,
    //     {
    //       method: "POST",
    //       body: formData,
    //     }
    //   );
    //   const data = await response.json();
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

  // Handle material image deletion after confirmation
  const confirmDeleteQuantity = async () => {
    if (!selectedMaterialForDeletion) return;

    const designData = designPreferencesByImageUrl[selectedMaterialForDeletion];

    if (!designData) {
      // console.log("No design data found for the selected material image.");
      return;
    }

    // console.log("designData ",designData)

    const designImages = designData?.design_images || [];
    const measurementDressImages = designData?.measurement_dress_images || []; // Include measurement dress images
    const allImagesForDeletion = [...designImages, ...measurementDressImages, selectedMaterialForDeletion]; // Include measurement dress images in deletion

  // Log the array of image URLs for deletion
  // console.log("Images for deletion:", allImagesForDeletion);

    
  const matchingCartItem = cart?.items?.find((item: LineItemWithDesign) => item.variant_id === variant?.id);

  const liningCartItem = cart?.items?.find((item: LineItemWithDesign) => item.variant_id === liningVariantId);


    // console.log("selectedMaterialForDeletion ", selectedMaterialForDeletion);
    // console.log("matchingCartItem ", matchingCartItem);
    // console.log("matchingCartItem.quantity ", matchingCartItem.quantity);

    // Now check if the selected material exists in the matching cart item's material_design_data
    // const existsInCart = matchingCartItem?.material_design_data?.[selectedMaterialForDeletion];

    // console.log("cart?.material_design_data ", matchingCartItem?.material_design_data);
    // console.log("existsInCart ", existsInCart);

    // if (existsInCart) {
      // If the material image exists in cart, call API to delete
      try {
        // console.log("matchingCartItem?.id ", matchingCartItem?.id);
        // console.log("selectedMaterialForDeletion ", selectedMaterialForDeletion);

        // Use axios delete and pass the data using `data` field
        await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteMaterialImage`, {
          data: {
            id: matchingCartItem?.id,
            material_image_url: selectedMaterialForDeletion,
          },
        });

        // Update the cart after deletion
        let decreaseQuantity = matchingCartItem.quantity - 1;

        console.log("delete designData.attach_lining ", designData.attach_lining);
        const message = await updateLineItem({
          lineId: matchingCartItem?.id,
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

          if(designData.attach_lining){

             // Update the cart after deletion
        let decreaseLiningQuantity = liningCartItem.quantity - 1;

        const messageLining = await updateLineItem({
          lineId: liningCartItem?.id,
          quantity: decreaseLiningQuantity,
        })
          .catch((err) => {
            return err.message;
          })
          .finally(() => {
          });
          }

         

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
        </div>

        {/* Image Upload Section */}
        <div className="flex flex-col gap-y-4">
          {/* <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadImage}
            disabled={uploading || !!disabled}
            style={{ display: "none" }}
            accept="image/*"
          /> */}
          {/* <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !!disabled}
            variant="secondary"
            className="w-full h-10"
            isLoading={uploading}
          >
            {uploading ? "Uploading..." : "Upload Material Image"}
          </Button> */}
        </div>

       <div className="flex flex-wrap gap-4">
  {Object.entries(designPreferencesByImageUrl).map(([materialImageUrl], index) => {
    // Check if the current materialImageUrl exists in the cart
    const existsInCart = cartItem?.material_design_data?.[materialImageUrl];

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
        {!existsInCart && (
          <div
            className="absolute top-2 right-2 bg-white rounded-full p-1 flex items-center cursor-pointer hover:scale-110 transition-transform"
            onClick={() => handleSpecificMaterialAddToCart(materialImageUrl)} // Add material to cart on icon click
            style={{ boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }} // Optional: adds subtle shadow to the icon
          >
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="shopping-cart text-lg transition-all duration-200" // Made the icon smaller
              style={{ color: "#EE0A67" }}
            />
            <span className="ml-2 text-xs text-gray-700">Add to Cart</span> {/* Made the text smaller */}
          </div>
        )}

        {/* In Cart / Not in Cart Status */}
        {existsInCart ? (
          <p className="text-green-600 text-sm mt-2">In Cart</p>
        ) : (
          <p className="text-red-600 text-sm mt-2">Not in Cart</p>
        )}
      </div>
    );
  })}
</div>


        {/* Quantity Adjustment Section */}
        {quantity > 0 && (
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
        : "#fc8b9c", // Mustard yellow for "Add to Cart"
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
            designPreferences={designPreferencesByImageUrl[selectedMaterialImageUrl!] || {}} // Pass preferences for the selected material image URL
            materialImageUrl={selectedMaterialImageUrl} // Pass the material image URL for the selected material image
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

      {/* <Modal open={modalOpen} onClose={() => setModalOpen(false)} aria-labelledby="modal-title">
  <Box
    sx={{ 
      backgroundColor: "white",
      p: { xs: 2, md: 4 }, 
      margin: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      position: "relative",
      borderRadius: "8px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", 
    }}
  >
    <IconButton
      aria-label="close"
      onClick={() => setModalOpen(false)}
      sx={{
        position: "absolute",
        right: 8,
        top: 8,
        color: "gray",
      }}
    >
      <X /> 
    </IconButton>

    <h2 id="modal-title" style={{ marginBottom: "16px", fontSize: "1.2rem", textAlign: "center" }}>
      Upload Material Image to be transformed into {product.title}
    </h2>

    <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
      <img
        src="/in/dress-fashion-blogger.svg" 
        alt="Fashion Blogger"
        style={{
          width: "60%", 
          height: "auto",
        }}
      />
    </div>

    <input
      type="file"
      onChange={handleUploadImage}
      accept="image/*"
      disabled={uploading}
      style={{
        display: "block",
        margin: "16px auto",
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "80%", 
      }}
    />
    {uploading && <p style={{ textAlign: "center" }}>Uploading...</p>}
  </Box>
</Modal> */}

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
