import React, { useState, useEffect, useMemo } from "react";
import { Address, Cart, Customer } from "@medusajs/medusa";
import { updateCustomerEmail } from "@modules/account/actions";
import Checkbox from "@modules/common/components/checkbox";
import Input from "@modules/common/components/input";
import AddressSelect from "../address-select";
import CountrySelect from "../country-select";
import { Container } from "@medusajs/ui";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { namePattern, cityPattern, postalCodePattern, phoneNumberPattern, emailPattern } from "@lib/util/regex"; // Make sure emailPattern is imported correctly
import ErrorMessage from "../error-message";
import Medusa from "@medusajs/medusa-js"
import { MEDUSA_BACKEND_URL } from "@lib/config";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLocation } from "@fortawesome/free-solid-svg-icons" // Import the location icon
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Warning icon


// Set up Leaflet marker icon to avoid default icon issue
// delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://leafletjs.com/examples/custom-icons/leaf-red.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom pink marker icon
const pinkMarkerIcon = new L.Icon({
  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], // size of the icon
  iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
  shadowSize: [41, 41] // size of the shadow
});

// Custom component to handle map click and place a pink marker at the clicked location
const LocationMarker = ({ clickedLocation, setClickedLocation }: { clickedLocation: [number, number] | null, setClickedLocation: (latlng: [number, number]) => void }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setClickedLocation([lat, lng]);
    },
  });

  return clickedLocation === null ? null : (
    <Marker position={clickedLocation} icon={pinkMarkerIcon} />
  );
};

const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 });

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  countryCode,
}: {
  customer: Omit<Customer, "password_hash"> | null;
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null;
  checked: boolean;
  onChange: () => void;
  countryCode: string;
}) => {
  const specificShippingAddress = useMemo(() => {
    if (!customer?.shipping_addresses) {
      // console.log("No shipping addresses found.");
      return null;
    }

    if (!cart?.shipping_address_id) {
      // console.log("No shipping address ID found in cart.");
      return null;
    }

    // Find the specific shipping address
    const address = customer.shipping_addresses.find(
      (address) => address.company === cart.shipping_address?.company
    );

    return address;
  }, [customer, cart?.shipping_address_id]);

  // console.log("Specific Shipping Address: ", specificShippingAddress);

  const [formData, setFormData] = useState({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || countryCode || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    // email: cart?.email || "",
    email: cart?.email?.endsWith("@unidentified.com") ? "" : cart?.email || "", // Set email to empty string if it ends with @unidentified.com
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    "shipping_address.latitude": specificShippingAddress?.latitude || null,
    "shipping_address.longitude": specificShippingAddress?.longitude || null,
  });

  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    city: "",
    province: "",
    postal_code: "",
    phone: "",
    email: "", 
    emailOrPhone: "",
  });

  // const validateEmailOrPhone = (email: string, phone: string) => {
  //   if (!email && !phone) {
  //     setErrors((prevErrors) => ({
  //       ...prevErrors,
  //       emailOrPhone: "Either email or phone number is required.",
  //     }));
  //     return false;
  //   } else {
  //     setErrors((prevErrors) => ({
  //       ...prevErrors,
  //       emailOrPhone: "", // Clear the error if at least one field is filled
  //     }));
  //     return true;
  //   }
  // };

  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [clickedLocation, setClickedLocation] = useState<[number, number] | null>(null);

  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Fetch geolocation to get current location coordinates
  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        setClickedLocation([latitude, longitude]);
        setUseCurrentLocation(true);
      },
      (error) => {
        console.error("Error getting location: ", error);
      }
    );
  };

  // Fetch the current location if latitude and longitude are not available
  useEffect(() => {
    if (!formData["shipping_address.latitude"] || !formData["shipping_address.longitude"]) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location: ", error);
        }
      );
    }
  }, [formData]);

  const countriesInRegion = useMemo(
    () => cart?.region.countries.map((c) => c.iso_2),
    [cart?.region]
  );

  // Check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.shipping_addresses.filter((a) =>
        countriesInRegion?.includes(a.country_code ?? "") // Default to empty string if country_code is null
  ),
    [customer?.shipping_addresses, countriesInRegion]
  );

  
  useEffect(() => {
    setFormData({
      "shipping_address.first_name": cart?.shipping_address?.first_name || "",
      "shipping_address.last_name": cart?.shipping_address?.last_name || "",
      "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
      "shipping_address.company": cart?.shipping_address?.company || "",
      "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
      "shipping_address.city": cart?.shipping_address?.city || "",
      "shipping_address.country_code": cart?.shipping_address?.country_code || "",
      "shipping_address.province": cart?.shipping_address?.province || "",
      // email: cart?.email || "",
      email: cart?.email?.endsWith("@unidentified.com") ? "" : cart?.email || "", // Set email to empty string if it ends with @unidentified.com
      "shipping_address.phone": cart?.shipping_address?.phone || "",
      "shipping_address.latitude": specificShippingAddress?.latitude || null,
      "shipping_address.longitude": specificShippingAddress?.longitude || null,
    });
  }, [cart?.shipping_address, cart?.email]);

  // Function to fetch email using the phone number
  const fetchEmailFromPhone = async (phoneNo: string) => {
    try {
      const response = await axios.get(`${MEDUSA_BACKEND_URL}/store/getEmailforPassword`, {
        params: { phoneNo }, // Send phone number to get the associated email
      });

      const data = response.data;

      if (data.customer && data.customer.email) {
        setFormData((prevData) => ({
          ...prevData,
          email: data.customer.email, // Set email from the API response
        }));
        console.log("Email fetched: ", data.customer.email);
      } else {
        setFormData((prevData) => ({
          ...prevData,
          email: `${phoneNo}@unidentified.com`, // Fallback email if no customer is found
        }));
        console.log("No customer found, setting email to fallback");
      }
    } catch (error) {
      console.error("Error fetching email from phone:", error);
    }
  };


  useEffect(() => {
    if (!formData.email) {
      console.log("Email is missing, fetching based on phone number:", formData["shipping_address.phone"]);
      if (formData["shipping_address.phone"]) {
        fetchEmailFromPhone(formData["shipping_address.phone"]); // Fetch email using the phone number
      }
    } else {
      console.log("Email on mount:", formData["email"]);
    }
  }, [formData.email, formData["shipping_address.phone"]]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "shipping_address.phone" && value) {
      fetchEmailFromPhone(value); // Fetch email based on the entered phone number
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // console.log("before validateField formData ",formData)

    validateField(name, value); // Validate the field

    // if (name === "email") {
    //   console.log("cartid ", cart?.id);
    //   console.log("Email value entered: ", value);
  
    //   if ((cart?.email?.endsWith("@unidentified.com") || customer?.email?.endsWith("@unidentified.com")) && cart?.id) {
    //     medusa.carts.update(cart.id, {
    //       email: value, // Use the newly entered email
    //     })
    //     .then(({ cart }) => {
    //       console.log("Cart updated with new email:", cart.email);
    //     })
    //     .catch((error) => {
    //       console.error("Error updating cart email:", error);
    //     });
  
    //     console.log("handleChange cart ", cart);
    //     console.log("handleChange customer ", customer);
  
    //     if (customer?.id) {
    //       axios.post('http://localhost:9000/store/updateCustomerEmail', {
    //         id: customer.id, // Pass customer id from customer object
    //         email: value // Use the newly entered email
    //       })
    //       .then(response => {
    //         console.log("Customer email updated successfully:", response.data);
    //       })
    //       .catch(error => {
    //         console.error("Error updating customer email:", error);
    //       });
    //     } else {
    //       console.error("No customer ID found for email update.");
    //     }
    //   } else {
    //     console.error("Cart ID is missing or invalid.");
    //   }
    // }
  };  

  const validateField = (name: string, value: string) => {
    let errorMsg = "";
    if (name === "shipping_address.first_name" || name === "shipping_address.last_name") {
      if (!namePattern.test(value)) errorMsg = "Invalid name format";
    } else if (name === "shipping_address.city") {
      if (!cityPattern.test(value)) errorMsg = "Invalid city name format";
    } else if (name === "shipping_address.province") {
      if (!cityPattern.test(value)) errorMsg = "Invalid State name format";
    } else if (name === "shipping_address.postal_code") {
      if (!postalCodePattern.test(value)) errorMsg = "Invalid postal code";
    } else if (name === "email") {
      if (!emailPattern.test(value)) errorMsg = "Invalid email format";
    } else if (name === "shipping_address.phone") {
      if (!phoneNumberPattern.test(value)) errorMsg = "Invalid phone number";
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name.split(".")[1]]: errorMsg,
    }));
  };


  const handleSetLocation = () => {
    if (clickedLocation) {
      const [lat, lng] = clickedLocation;

      // console.log("Latitude:", lat, "Longitude:", lng);

      const geocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      
      fetch(geocodingUrl)
        .then(response => response.json())
        .then(data => {
          // console.log("data ", data);

          if (data && data.address) {
            // Update the cart's shipping address with the relevant details from the geocoding data
            const newShippingAddress = {
              ...cart?.shipping_address,
              latitude: lat,
              longitude: lng,
              address_1: `${data.address.suburb || ''} ${data.address.county || ''} ${data.address.city_district || ''}`,
              city: data.address.state_district,
              postal_code: data.address.postcode,
              province: data.address.state,
              country_code: data.address.country_code,
            };

            // console.log("Updated Shipping Address: ", newShippingAddress);

            setFormData({
              ...formData,
              "shipping_address.latitude": lat,
              "shipping_address.longitude": lng,
              "shipping_address.address_1": newShippingAddress.address_1,
              "shipping_address.city": newShippingAddress.city,
              "shipping_address.postal_code": newShippingAddress.postal_code,
              "shipping_address.province": newShippingAddress.province,
              "shipping_address.country_code": newShippingAddress.country_code,
            });
          } else {
            // console.log("No address found for clicked location.");
          }
        })
        .catch(err => console.error("Error fetching address:", err));
    } else {
      console.log("No location has been selected yet.");
    }
  };
  // console.log("errors.province ", errors.province);

  // console.log("errors.email ", errors.email);

  // console.log("cart",cart)
  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5 z-20 relative">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect addresses={customer.shipping_addresses} cart={cart} />
        </Container>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
         {errors.first_name && (
          <ErrorMessage error={errors.first_name} data-testid="first-name-error" />
        )}
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        {errors.last_name && (
          <ErrorMessage error={errors.last_name} data-testid="last-name-error" />
        )}
      </div>

      {/* Show Map if latitude and longitude exist, otherwise show current location */}
      {(formData["shipping_address.latitude"] && formData["shipping_address.longitude"]) || currentLocation ? (
  <div className="mt-4 mb-4 relative z-10 ">
    <h3 className="text-small-regular">Map Location</h3>
    <MapContainer
      center={
        formData["shipping_address.latitude"] && formData["shipping_address.longitude"]
          ? [formData["shipping_address.latitude"], formData["shipping_address.longitude"]]
          : currentLocation || [0, 0] // Fallback to a default location like [0, 0] if both are null
      }
      zoom={13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; Anikaa Designs Solutions'
      />
      {/* Conditionally render the marker only if there are valid coordinates */}
      {(formData["shipping_address.latitude"] && formData["shipping_address.longitude"]) || currentLocation ? (
        <Marker
          position={
            formData["shipping_address.latitude"] && formData["shipping_address.longitude"]
              ? [formData["shipping_address.latitude"], formData["shipping_address.longitude"]]
              : currentLocation!
          }
        />
      ) : null}
      {/* Pink Marker that moves based on user clicks */}
      <LocationMarker clickedLocation={clickedLocation} setClickedLocation={setClickedLocation} />
    </MapContainer>
    <div className="flex justify-between items-center mt-4">
  <button
    type="button"
    className="px-2 py-1 bg-[#6e323b] text-white text-small-semi"
    onClick={handleSetLocation}
  >
    Set Location
  </button>

  <button
    type="button"
    className="px-2 py-1 bg-[#e88b9a] text-white text-small-semi flex items-center"
    onClick={handleUseCurrentLocation}
  >
    <FontAwesomeIcon icon={faLocation} className="mr-2" />
    Use Current Location
  </button>
</div>

  </div>
) : (
  <p className="text-small-regular">Unable to display map: No coordinates available.</p>
)}
      <div className="flex items-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-2" role="alert">
  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-600" />
  <p className="text-sm">
    The address auto-filled from the map location may not match your actual address. Please double-check and update the fields with your correct address if necessary.
  </p>
</div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Address"
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        
        <Input
          label="Location Name"
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
        />
        <Input
          label="Postal code"
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
        />
        {errors.postal_code && (
          <ErrorMessage error={errors.postal_code} data-testid="postal-code-error" />
        )}
        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />
         {errors.city && (
          <ErrorMessage error={errors.city} data-testid="city-error" />
        )}
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <Input
          label="State / Province"
          name="shipping_address.province"
          autoComplete="address-level1"
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-input"
        />
        {errors.province && (
          <ErrorMessage error={errors.province} data-testid="province-error" />
        )}
      </div>

      <div className="my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="hidden">
        <Input
          label="Email"
          name="email"
          type="email"
          title="Enter a valid email address."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          data-testid="shipping-email-input"
        />
        {errors.email && (
          <ErrorMessage error={errors.email} data-testid="email-error" />
        )}
        </div>
        <Input
          label="Phone"
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
        {errors.phone && (
          <ErrorMessage error={errors.phone} data-testid="phone-error" />
        )}
      </div>
    </>
  );
};

export default ShippingAddress;


