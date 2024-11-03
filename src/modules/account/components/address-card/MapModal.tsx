"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { Modal, Box, IconButton, TextField, Grid, Button } from "@mui/material";
import { Address } from "@medusajs/medusa";
import X from "@modules/common/icons/x"; // X icon imported here
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocation } from "@fortawesome/free-solid-svg-icons"; // Import the location icon
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
import { MEDUSA_BACKEND_URL } from "@lib/config";
import { LeafletMouseEvent } from "leaflet";
import {
  phoneNumberPattern,
  namePattern,
  postalCodePattern,
  cityPattern,
} from "@lib/util/regex"; // Import the regex patterns
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Warning icon


// Dynamically import MapContainer, TileLayer, and Marker from React Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});

// Declare L as a `null` initially to make sure it doesn't cause issues during SSR
let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

type MapModalProps = {
  open: boolean;
  onClose: () => void;
  address: Omit<Address, "beforeInsert">; // Updated to omit 'beforeInsert'
};

const MapModal: React.FC<MapModalProps> = ({ open, onClose, address }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [updatedAddress, setUpdatedAddress] = useState<Omit<Address, "beforeInsert"> | null>(address);

  // Editable fields for personal information
  const [firstName, setFirstName] = useState<string>(address.first_name || "");
  const [lastName, setLastName] = useState<string>(address.last_name || "");
  const [company, setCompany] = useState<string>(address.company || "");
  const [phone, setPhone] = useState<string>(address.phone || "");
  const [city, setCity] = useState<string>(address.city || "");
  const [province, setProvince] = useState<string>(address.province || "");
  const [postalCode, setPostalCode] = useState<string>(address.postal_code || "");

  // Error states
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    province: "",
    postalCode: "",
  });

  useEffect(() => {
    if (address.latitude && address.longitude) {
      setPosition({ lat: address.latitude, lng: address.longitude });
    } else {
      const geocodeAddress = async (addressString: string) => {
        return new Promise<{ lat: number; lng: number }>((resolve) => {
          setTimeout(() => {
            resolve({ lat: 40.7128, lng: -74.006 }); // Example: New York City coordinates
          }, 1000);
        });
      };

      if (address) {
        const fullAddress = `${address.address_1}, ${address.city}, ${address.country_code}`;
        geocodeAddress(fullAddress).then((coords) => {
          setPosition(coords);
        });
      }
    }
  }, [address]);

  // Component to handle clicking on the map to change marker position and update the address
  const LocationSelector = () => {
    const { useMapEvents } = require("react-leaflet");

    useMapEvents({
      click: async (e: LeafletMouseEvent) => {
        const newPosition = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(newPosition);
        const newAddress = await reverseGeocode(newPosition.lat, newPosition.lng);
        if (newAddress) {
          setUpdatedAddress(newAddress);
        }
      },
    });

    return null;
  };

  // Function to reverse geocode latitude and longitude into an address using Nominatim API
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch reverse geocoding data");
      }
      const data = await response.json();

      console.log("data ", data.address);

      // Extract necessary fields from the response
      const address_1 = [
        data.address.road,
        data.address.suburb,
        data.address.city_district,
        data.address.county,
      ]
        .filter(Boolean)
        .join(", ");

      // Update city, province, postal code based on the response
      setCity(data.address.state_district || address.city);
      setProvince(data.address.state || address.province);
      setPostalCode(data.address.postcode || address.postal_code);

      const updatedAddr: Omit<Address, 'beforeInsert'> = {
        ...address,
        address_1: address_1 || address.address_1,
        city: data.address.state_district || address.city,
        postal_code: data.address.postcode || address.postal_code,
        country_code: data.address.country_code || address.country_code,
        province: data.address.state || address.province,
        latitude: lat,
        longitude: lng,
      };

      return updatedAddr;
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return null;
    }
  };

  const handleSaveAddress = async () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      phone: "",
      city: "",
      province: "",
      postalCode: "",
    };

    // Validate form fields
    if (!namePattern.test(firstName)) newErrors.firstName = "First Name should only contain alphabets";
    if (lastName && !namePattern.test(lastName)) newErrors.lastName = "Last Name should only contain alphabets";
    if (!phoneNumberPattern.test(phone)) newErrors.phone = "Phone number should start with +91 and be 10 digits.";
    if (!cityPattern.test(city)) newErrors.city = "City name should only contain alphabets.";
    if (!cityPattern.test(province)) newErrors.province = "Province name should only contain alphabets.";
    if (!postalCodePattern.test(postalCode)) newErrors.postalCode = "Postal Code should be a 6-digit number.";

    setErrors(newErrors);

    // Prevent form submission if there are errors
    if (
      newErrors.firstName ||
      newErrors.lastName ||
      newErrors.phone ||
      newErrors.city ||
      newErrors.province ||
      newErrors.postalCode
    ) {
      return;
    }

    if (updatedAddress && position) {
      const finalAddress = {
        ...updatedAddress,
        first_name: firstName,
        last_name: lastName,
        company: company,
        phone: phone,
        latitude: position.lat,
        longitude: position.lng,
        city: city,
        province: province,
        postal_code: postalCode,
      };

      const requestBody = {
        customerId: updatedAddress.customer_id,
        addressId: updatedAddress.id,
        newAddress: finalAddress,
      };

      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}/store/editLatLong`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          // console.log("Address updated successfully");
          onClose();
        } else {
          console.error("Failed to update address:", response.statusText);
        }
      } catch (error) {
        console.error("Error in updating address:", error);
      }
    }
  };

  // Function to handle "Use Current Location"
  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude };
        setPosition(latLng);
        const newAddress = await reverseGeocode(latLng.lat, latLng.lng);
        if (newAddress) {
          setUpdatedAddress(newAddress);
        }
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  // Input validation and error clearing logic
  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    errorField: keyof typeof errors,
    pattern: RegExp,
    value: string
  ) => {
    setter(value);
    if (pattern.test(value)) {
      setErrors((prevErrors) => ({ ...prevErrors, [errorField]: "" }));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="map-modal-title"
      aria-describedby="map-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: "8px",
          p: 4,
          outline: "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          fontFamily:"Caudex, serif"
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}
        >
          <X />
        </IconButton>

        {typeof window !== "undefined" && position && (
          <Box sx={{ height: "45%", mb: 1, position: "relative" }}>
            <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; Anikaa Designs Solutions'
              />
              <Marker
                position={position}
                icon={L.icon({
                  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
              />
              <LocationSelector />
            </MapContainer>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="absolute top-3 right-3 bg-[#fc8b9c] text-white py-2 px-4 rounded shadow flex items-center gap-2"
              style={{ zIndex: 1000 }}
            >
              <FontAwesomeIcon icon={faLocation} /> {/* Add the location icon */}
              Use Current Location
            </button>
          </Box>
        )}

<div className="flex items-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mb-3" role="alert">
  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-600" />
  <p className="text-small-regular">
    The address auto-filled from the map location may not match your actual address. Please double-check and update the fields with your correct address if necessary.
  </p>
</div>

        <Grid container spacing={2}>
          <Grid item xs={6} sm={6}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => handleInputChange(setFirstName, "firstName", namePattern, e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => handleInputChange(setLastName, "lastName", namePattern, e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={6} sm={6}>
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => handleInputChange(setPhone, "phone", phoneNumberPattern, e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              value={updatedAddress?.address_1 || ""}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="City"
              value={city}
              onChange={(e) => handleInputChange(setCity, "city", cityPattern, e.target.value)}
              variant="outlined"
              size="small"
                className="font-caudex"
              fullWidth
              error={!!errors.city}
              helperText={errors.city}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Postal Code"
              value={postalCode}
              onChange={(e) => handleInputChange(setPostalCode, "postalCode", postalCodePattern, e.target.value)}
              variant="outlined"
              size="small"
                className="font-caudex"
              fullWidth
              error={!!errors.postalCode}
              helperText={errors.postalCode}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Province"
              value={province}
              onChange={(e) => handleInputChange(setProvince, "province", cityPattern, e.target.value)}
              variant="outlined"
              size="small"
                className="font-caudex"
              fullWidth
              error={!!errors.province}
              helperText={errors.province}
            />
          </Grid>
          <Grid item xs={12} sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAddress}
              sx={{ mt: 2, background: "#6e323b", borderRadius: "0px", color: "white", fontFamily:"Caudex, serif" }}
            >
              Save Edited Address
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
};

export default MapModal;
