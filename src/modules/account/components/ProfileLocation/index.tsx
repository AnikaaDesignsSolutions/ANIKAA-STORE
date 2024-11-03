"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button, IconButton } from "@medusajs/ui";
import { Grid, Modal, Box, TextField } from "@mui/material";
import X from "@modules/common/icons/x";
import { MEDUSA_BACKEND_URL } from "@lib/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

// Regex patterns
const namePattern = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
const phonePattern = /^(\+91)?[7-9][0-9]{9}$/;

// Dynamically import ProfileLocationMap with no SSR
const ProfileLocationMap = dynamic(() => import("./ProfileLocationMap"), { ssr: false });

type ProfileLocationProps = {
  modalState: boolean;
  closeModal: () => void;
  customerId: string;
};

const ProfileLocation: React.FC<ProfileLocationProps> = ({
  modalState,
  closeModal,
  customerId,
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [address_1, setAddress_1] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("");
  const [province, setProvince] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(13);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);

  // Input field state variables
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [company, setCompany] = useState<string>("");

  // Error state variables
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
  });

  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const isClient = typeof window !== "undefined";

  // Get the current location of the user as soon as the component loads
  useEffect(() => {
    if (isClient && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setPosition(coords);
          setZoom(15); // Zoom in closer when current location is retrieved
          setLoading(false);
        },
        (error) => {
          console.error("Error getting initial location:", error);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, [isClient]);

  // Validate fields
  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "firstName":
        if (!namePattern.test(value)) {
          error = "First name should only contain alphabets.";
        }
        break;
      case "lastName":
        if (value && !namePattern.test(value)) {
          error = "Last name should only contain alphabets.";
        }
        break;
      case "phone":
        if (!phonePattern.test(value)) {
          error = "Phone number must start with +91 and be 10 digits long.";
        }
        break;
      case "company":
        if (!value) {
          error = "Location Name is required.";
        }
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    checkFormValidity({ ...errors, [name]: error });
  };

  // Check form validity
  const checkFormValidity = (updatedErrors: typeof errors) => {
    const isValid = !Object.values(updatedErrors).some((error) => error !== "") && company !== "";
    setIsFormValid(isValid);
  };

  // Function to get the current location when the button is clicked
  const handleUseCurrentLocation = () => {
    if (isClient && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setPosition(coords);
          setZoom(15); // Zoom in closer when current location is retrieved
          setLoading(false);
        },
        (error) => {
          console.error("Error getting current location:", error);
          setLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Function to fetch the address using reverse geocoding
  useEffect(() => {
    if (position) {
      const fetchAddress = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json`
          );
          const data = await response.json();

          console.log("data.address ",data.address)
          if (data && data.address) {
            const {
              road,
              neighbourhood,
              suburb,
              shop,
              county,
              state_district,
              city_district,
              city,
              postcode,
              state,
              country_code,
            } = data.address;

            const addressLine1Parts = [
              shop,
              road,
              neighbourhood,
              suburb,
              city_district,
              county,
            ].filter(Boolean);
            setAddress_1(addressLine1Parts.join(", "));

            setCountryCode(country_code || "");
            setCity(city || state_district || "");
            setPostalCode(postcode || "");
            setProvince(state || "");
          }
        } catch (err) {
          console.error("Failed to fetch address:", err);
        }
      };
      fetchAddress();
    }
  }, [position]);

  // Function to handle the "Confirm Address" button click
  const handleConfirmAddress = async () => {
    if (position && isFormValid) {
      const { lat, lng } = position;

      const newAddress = {
        first_name: firstName,
        last_name: lastName,
        phone,
        address_1,
        city,
        country_code: countryCode,
        province,
        company,
        postal_code: postalCode,
        latitude: lat,
        longitude: lng,
      };

      // Make a POST request to update the address in the server
      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}/store/updateLatLong`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            newAddress,
          }),
        });

        const responseData = await response.json();
        if (response.ok) {
          closeModal();
        } else {
          console.error("Failed to update address:", responseData.message);
        }
      } catch (error) {
        console.error("Error updating address:", error);
      }
    } else {
      console.log("No location selected or form is invalid.");
    }
  };

  return (
    <Modal
      open={modalState}
      onClose={closeModal}
      aria-labelledby="set-address-map-modal"
      aria-describedby="modal-modal-description"
      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          position: "relative",
          width: "90vw",
          height: "85vh",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: "8px",
          p: 4,
          outline: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Close button in the top-right corner */}
        <IconButton
          onClick={closeModal}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000, // Ensures the button appears above all other elements in the modal
          }}
        >
          <X />
        </IconButton>

        <Button
          variant="primary"
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="h-10 mb-4"
          style={{ backgroundColor: "#fc8b9c" }}
        >
          <FontAwesomeIcon icon={faLocationDot} />
          &nbsp;
          {loading ? "Getting Current Location..." : "Use Current Location"}
        </Button>
        <div style={{ flex: 1 }}>
          {isClient && (
            <ProfileLocationMap
              position={position}
              setPosition={setPosition}
              zoom={zoom}
              setZoom={setZoom}
            />
          )}
        </div>
        <div style={{ marginTop: "20px" }}>
          {showAddressForm ? (
            <>
              <Grid container spacing={2} className="mb-4">
                <Grid item xs={6} sm={6}>
                  <TextField
                    label="First Name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      validateField("firstName", e.target.value);
                    }}
                    required
                    fullWidth
                    margin="normal"
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                  />
                </Grid>
                <Grid item xs={6} sm={6}>
                  <TextField
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      validateField("lastName", e.target.value);
                    }}
                    // required
                    fullWidth
                    margin="normal"
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                  />
                </Grid>
                <Grid item xs={6} sm={6}>
                  <TextField
                    label="Phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      validateField("phone", e.target.value);
                    }}
                    required
                    fullWidth
                    margin="normal"
                    error={!!errors.phone}
                    helperText={errors.phone}
                  />
                </Grid>
                <Grid item xs={6} sm={6}>
                  <TextField
                    label="Location Name"
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);
                      validateField("company", e.target.value);
                    }}
                    required
                    fullWidth
                    margin="normal"
                    error={!!errors.company}
                    helperText={errors.company} // Display the error message for company field
                  />
                </Grid>
              </Grid>
              <Button
                variant="primary"
                onClick={handleConfirmAddress}
                className="h-10"
                data-testid="confirm-address-button"
                style={{ backgroundColor: "#6e323b" }}
                disabled={!isFormValid} // Disable when there are validation errors or company is not filled
              >
                Confirm Address
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                if (position) {
                  setShowAddressForm(true);
                } else {
                  console.log("No location selected.");
                }
              }}
              className="h-10"
              data-testid="set-address-button"
              style={{ backgroundColor: "#6e323b" }}
            >
              Set Address with This Location
            </Button>
          )}
        </div>
      </Box>
    </Modal>
  );
};

export default ProfileLocation;
