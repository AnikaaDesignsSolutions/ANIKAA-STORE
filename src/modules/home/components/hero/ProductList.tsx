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
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import X from "@modules/common/icons/x";
import { MEDUSA_BACKEND_URL } from "@lib/config";

type Price = {
  amount: number;
  price_list_id: string | null;
};

type Variant = {
  product_id: string;
  product_title: string;
  product_thumbnail: string;
  prices: Price[];
  saleAmount?: number;
  amountDifference?: number;
  percentageDifference?: string;
};

type PriceList = {
  price_list_id: string;
  variants: Variant[];
};

const ProductModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [products, setProducts] = useState<Variant[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get<PriceList[]>(
          `${MEDUSA_BACKEND_URL}/store/pricelists`
        );

        const filteredProducts = response.data.flatMap((priceList) =>
          priceList.variants
            .filter((variant) => {
              const prices = variant.prices;
              const nonSalePrice = prices.find((p) => p.price_list_id === null);
              const salePrice = prices.find(
                (p) =>
                  p.price_list_id &&
                  p.amount < (nonSalePrice?.amount || Infinity)
              );

              return (
                salePrice &&
                nonSalePrice &&
                salePrice.amount < nonSalePrice.amount
              );
            })
            .map((variant) => {
              const nonSalePrice = variant.prices.find(
                (p) => p.price_list_id === null
              );
              const salePrice = variant.prices.find(
                (p) =>
                  p.price_list_id &&
                  p.amount < (nonSalePrice?.amount || Infinity)
              );

              if (nonSalePrice && salePrice) {
                const amountDifference =
                  nonSalePrice.amount - salePrice.amount;
                const percentageDifference = (
                  (amountDifference / nonSalePrice.amount) *
                  100
                ).toFixed(2);

                return {
                  ...variant,
                  saleAmount: salePrice.amount,
                  amountDifference,
                  percentageDifference,
                };
              }

              return null;
            })
            .filter(Boolean)
        );

        setProducts(filteredProducts as Variant[]);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

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
      }}
    >
      <Box
        sx={{
          width: 500,
          padding: 4,
          backgroundColor: "#fca4bf",
        //   borderRadius: 3,
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Starry Background Layer */}
        {[...Array(40)].map((_, index) => ( // Increase star count for a richer effect
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`, // Star sizes between 1px and 5px
              height: `${Math.random() * 4 + 1}px`,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            //   borderRadius: "50%",
              opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2 and 1
              boxShadow: "0 0 4px rgba(255, 255, 255, 0.5)", // Optional glow effect
              pointerEvents: "none",
            }}
          />
        ))}

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
          {products.map((product) => (
            <ListItem key={product.product_id} sx={{ flexDirection: "column", alignItems: "center" }}>
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, textAlign:"center" }}>
              <Typography variant="h5" fontWeight="bold">
  Customize your perfect {product.product_title}{" "}
  <Box component="span" color="yellow" fontWeight="bold">
     Starting from ₹{product.saleAmount}
  </Box>
</Typography>

              </Box>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "white",
                  color: "#ee0a67",
                  fontWeight: "bold",
                  mt: 1,
                  ":hover": { backgroundColor: "#f3f3f3" },
                }}
                onClick={() =>
                  window.location.href = `/explore/products/${product.product_title}`
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
