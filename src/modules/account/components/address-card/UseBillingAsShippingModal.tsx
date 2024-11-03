"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button, Typography, Modal, Box, TextField } from "@mui/material";
import { Customer } from "@medusajs/medusa";
import { phoneNumberPattern } from "@lib/util/regex";
import { MEDUSA_BACKEND_URL } from "@lib/config";

// Dynamically import LeafletMap only on the client side
const LeafletMap = dynamic(() => import("@modules/account/components/address-card/LeafletMap"), { ssr: false });

type UseBillingAsShippingModalProps = {
  customer: Omit<Customer, "password_hash">;
  isOpen: boolean;
  onClose: () => void;
};

const UseBillingAsShippingModal: React.FC<UseBillingAsShippingModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const [billingAddress, setBillingAddress] = useState({
    ...customer.billing_address,
    id: "", // Explicitly set id to an empty string initially
  });
  const [phone, setPhone] = useState(billingAddress.phone || "");
  const [company, setCompany] = useState(billingAddress.company || "");
  const [phoneError, setPhoneError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (customer?.billing_address) {
      const { id, ...addressWithoutId } = customer.billing_address;
      setBillingAddress({ ...addressWithoutId, id: "" }); // Set id to an empty string
      setPhone(customer.billing_address.phone || "");
      setCompany(customer.billing_address.company || "");
    }
  }, [customer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhoneValue = e.target.value;
    setPhone(newPhoneValue);

    if (!phoneNumberPattern.test(newPhoneValue)) {
      setPhoneError("Invalid phone number. Please match the format +XX XXXXXXXX.");
    } else {
      setPhoneError("");
    }

    checkFormValidity(newPhoneValue, company);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCompanyValue = e.target.value;
    setCompany(newCompanyValue);
    checkFormValidity(phone, newCompanyValue);
  };

  const checkFormValidity = (phoneValue: string, companyValue: string) => {
    setIsFormValid(phoneNumberPattern.test(phoneValue) && companyValue.trim() !== "");
  };

  const handleSetLocationName = async () => {
    if (isFormValid) {
      const newAddress = {
        ...billingAddress,
        phone,
        company,
      };

      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}/store/updateLatLong`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: customer.id,
            newAddress,
          }),
        });

        if (response.ok) {
          onClose();
        } else {
          const responseData = await response.json();
          console.error("Failed to update address:", responseData.message);
        }
      } catch (error) {
        console.error("Error updating address:", error);
      }
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          height: "90vh",
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          fontFamily: "Caudex, serif",
          p: 4,
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom style={{ fontFamily: "Caudex, serif" }}>
          Use Billing Address as Shipping Address
        </Typography>

        {/* Company and Phone Fields */}
        <Box
          component="form"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
          }}
        >
          <TextField
            label="Location Name"
            value={company}
            fullWidth
            margin="normal"
            required
            onChange={handleCompanyChange}
          />
          <TextField
            label="Phone"
            value={phone}
            fullWidth
            margin="normal"
            required
            error={!!phoneError}
            helperText={phoneError}
            onChange={handlePhoneChange}
          />
        </Box>

        {/* First Name, Last Name, and Landmark in the same row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="First Name"
            value={billingAddress.first_name || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
          <TextField
            label="Last Name"
            value={billingAddress.last_name || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
          <TextField
            label="Landmark"
            value={billingAddress.address_2 || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
        </Box>

        {/* Address, City, and Postal Code in the same row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="Address"
            value={billingAddress.address_1 || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
          <TextField
            label="City"
            value={billingAddress.city || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
          <TextField
            label="Postal Code"
            value={billingAddress.postal_code || ""}
            fullWidth
            margin="normal"
            InputProps={{ readOnly: true }}
            disabled
          />
        </Box>

        {/* Conditionally render Leaflet map if latitude and longitude are available */}
        {billingAddress.latitude && billingAddress.longitude && (
          <Box sx={{ height: 250, marginTop: 2 }}>
            <LeafletMap latitude={billingAddress.latitude} longitude={billingAddress.longitude} />
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleSetLocationName}
            disabled={!isFormValid}
            sx={{ background: "#fc8b9c" }}
          >
            Set Location Name
          </Button>
          <Button variant="contained" onClick={onClose} sx={{ background: "black" }}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default UseBillingAsShippingModal;
