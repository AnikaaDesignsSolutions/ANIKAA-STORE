"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Modal,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  IconButton,
  keyframes,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import X from "@modules/common/icons/x";
import { MEDUSA_BACKEND_URL } from "@lib/config";

// Define the structure for price and variant data
type Price = {
  amount: number;
  price_list_id: string | null;
};

type Variant = {
  product_id: string;
  product_title: string;
  product_thumbnail: string;
  handle: string;
  variant_title: string;
  prices: Price[];
  saleAmount?: number;
  amountDifference?: number;
  percentageDifference?: string;
};

// Define the structure for the price list
type PriceList = {
  price_list_id: string;
  variants: Variant[];
};

// Define keyframes for blinking and moving
const blinkAndMove = keyframes`
  0% {
    transform: translate(0, 0);
    opacity: 0.8;
  }
  50% {
    transform: translate(-10px, 10px);
    opacity: 0.3;
  }
  100% {
    transform: translate(10px, -10px);
    opacity: 0.8;
  }
`;

const ProductModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [groupedProducts, setGroupedProducts] = useState<{ [key: string]: Variant[] }>({});
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Fetch products with sale prices on component mount or when modal opens
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get<PriceList[]>(`${MEDUSA_BACKEND_URL}/store/pricelists`);

        // Filter products with valid sale prices and group by product_id
        const productsById: { [key: string]: Variant[] } = {};

        response.data.forEach((priceList) => {
          priceList.variants.forEach((variant) => {
            const nonSalePrice = variant.prices.find((p) => p.price_list_id === null);
            const salePrice = variant.prices.find(
              (p) => p.price_list_id && p.amount < (nonSalePrice?.amount || Infinity)
            );

            if (nonSalePrice && salePrice && salePrice.amount < nonSalePrice.amount) {
              const amountDifference = (nonSalePrice.amount - salePrice.amount) / 100;
              const percentageDifference = (
                (amountDifference / (nonSalePrice.amount / 100)) *
                100
              ).toFixed(2);

              const updatedVariant = {
                ...variant,
                saleAmount: salePrice.amount / 100,
                amountDifference,
                percentageDifference,
              };

              if (!productsById[variant.product_id]) {
                productsById[variant.product_id] = [];
              }
              productsById[variant.product_id].push(updatedVariant);
            }
          });
        });

        setGroupedProducts(productsById);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  // Do not render modal if no products are available
  if (Object.keys(groupedProducts).length === 0) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="product-modal-title"
      aria-describedby="product-modal-description"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: { xs: "100%", sm: 400, md: 500 },
          padding: { xs: 2, sm: 4 },
          backgroundColor: "#fca4bf",
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)",
          borderRadius: "8px",
        }}
      >
        {/* Decorative Background Stars */}
        {[...Array(40)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 0 4px rgba(255, 255, 255, 0.5)",
              pointerEvents: "none",
              borderRadius: "50%",
              animation: `${blinkAndMove} ${Math.random() * 2 + 2}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "white",
          }}
        >
          <X />
        </IconButton>

        {/* Product List with Advertisement Styling */}
        <List>
          {Object.entries(groupedProducts).map(([productId, variants], idx) => (
            <ListItem
              key={productId}
              sx={{ flexDirection: "column", alignItems: "center", my: 2 }}
            >
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" fontWeight="bold" fontSize={{ xs: "1.25rem", sm: "1.5rem" }}>
                  {`Customize your perfect ${variants[0].product_title}`}
                </Typography>
                {variants.map((variant, vIdx) => (
                  <Box key={vIdx} sx={{ mt: 1, textAlign: "center" }}>
                    <Typography
                      variant="body1"
                      color="yellow"
                      fontWeight="bold"
                      fontSize={{ xs: "0.9rem", sm: "1rem" }}
                    >
                      {variant.variant_title} - Starting from ₹{variant.saleAmount}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="white"
                      sx={{ mt: 0.5 }}
                      fontSize={{ xs: "0.8rem", sm: "0.9rem" }}
                    >
                      Save {variant.percentageDifference}% - ₹{variant.amountDifference} off!
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "#ee0a67",
                  fontWeight: "bold",
                  fontSize: { xs: "0.8rem", sm: "1rem" },
                  ":hover": { backgroundColor: "#f3f3f3" },
                }}
                onClick={() =>
                  window.location.href = `/explore/products/${variants[0].handle}`
                }
              >
                Customize Now
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>
    </Modal>
  );
};

export default ProductModal;
