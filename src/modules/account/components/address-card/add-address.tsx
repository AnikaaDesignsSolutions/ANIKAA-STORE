"use client";

import { useState, useEffect } from "react";
import { Region, Customer } from "@medusajs/medusa";
import { Plus, MapPin } from "@medusajs/icons";
import { Button, Heading } from "@medusajs/ui";
import { useFormState } from "react-dom";
import useToggleState from "@lib/hooks/use-toggle-state";
import CountrySelect from "@modules/checkout/components/country-select";
import Input from "@modules/common/components/input";
import Modal from "@modules/common/components/modal";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import { addCustomerShippingAddress } from "@modules/account/actions";
import ProfileLocation from "../ProfileLocation";
import { namePattern, cityPattern, postalCodePattern, phoneNumberPattern } from "@lib/util/regex";
import UseBillingAsShippingModal from "./UseBillingAsShippingModal";

// Updated Address type with null allowed
type Address = {
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  province?: string | null;
  country_code?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const AddAddress = ({ region, customer }: { region: Region, customer: Omit<Customer, "password_hash"> }) => {
  const [successState, setSuccessState] = useState(false);
  const { state: modalState, open: openModal, close: closeModal } = useToggleState(false);
  const [addressMethod, setAddressMethod] = useState<"manual" | "map" | null>(null);
  const [formState, formAction] = useFormState(addCustomerShippingAddress, {
    success: false,
    error: null,
  });

  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [useBillingModalOpen, setUseBillingModalOpen] = useState(false);

  // console.log("customer?.billing_address ",customer?.billing_address)
  const billingAddress: Address = useBillingAddress && customer?.billing_address
    ? {
        first_name: customer.billing_address.first_name,
        last_name: customer.billing_address.last_name,
        company: customer.billing_address.company,
        address_1: customer.billing_address.address_1,
        address_2: customer.billing_address.address_2,
        postal_code: customer.billing_address.postal_code,
        city: customer.billing_address.city,
        province: customer.billing_address.province,
        country_code: customer.billing_address.country_code,
        phone: customer.billing_address.phone,
        latitude: customer.billing_address.latitude,
        longitude: customer.billing_address.longitude,

      }
    : {};

  const [selectedCountry, setSelectedCountry] = useState(billingAddress.country_code || "in");
  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    postal_code: "",
    city: "",
    province: "",
    phone: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);

  const close = () => {
    setSuccessState(false);
    closeModal();
    setAddressMethod(null); // Reset the method when modal closes
  };

  useEffect(() => {
    if (successState) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState]);

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true);
    }
  }, [formState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "first_name":
        if (!namePattern.test(value)) {
          error = "First Name should only contain alphabets.";
        }
        break;
      case "last_name":
        if (value && !namePattern.test(value)) {
          error = "Last Name should only contain alphabets.";
        }
        break;
      case "company":
          if (!value ) {
            error = "Location is not filled";
          }
          break;
      case "postal_code":
        if (!postalCodePattern.test(value)) {
          error = "Postal Code should be a 6-digit number.";
        }
        break;
      case "city":
        if (!cityPattern.test(value)) {
          error = "City name should only contain alphabets.";
        }
        break;
      case "province":
        if (!value && !cityPattern.test(value)) {
          error = "Province name should only contain alphabets.";
        }
        break;
      case "phone":
        if (!phoneNumberPattern.test(value)) {
          error = "Phone number should start with +91 and be 10 digits.";
        }
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
    checkFormValidity({ ...errors, [name]: error });
  };

  const checkFormValidity = (updatedErrors: typeof errors) => {
    const isValid = !Object.values(updatedErrors).some((error) => error !== "");
    setIsFormValid(isValid);
  };

  const checkIfAddressIsEqual = (billingAddress: Address, shippingAddresses: Address[]) => {
    let addressFound = false; // Flag to track if a match is found
  
    const normalizeValue = (val1: string | null | undefined, val2: string | null | undefined) => {
      // Treat null and empty string as equal, convert both to empty string for comparison
      return (val1 || "").trim() === (val2 || "").trim();
    };
  
    shippingAddresses.forEach((shippingAddress) => {
      const isEqual = 
        normalizeValue(billingAddress?.first_name, shippingAddress.first_name) &&
        normalizeValue(billingAddress?.last_name, shippingAddress.last_name) &&
        normalizeValue(billingAddress?.address_1, shippingAddress.address_1) &&
        normalizeValue(billingAddress?.address_2, shippingAddress.address_2) &&
        normalizeValue(billingAddress?.city, shippingAddress.city) &&
        normalizeValue(billingAddress?.postal_code, shippingAddress.postal_code) &&
        normalizeValue(billingAddress?.province, shippingAddress.province);
  
      if (isEqual) {
        addressFound = true; // Set the flag to true if a match is found
      }
    });
  
    return addressFound; // Return whether an equal address was found
  };
  
  const billing_address = customer.billing_address; // Billing address object
  const shippingAddresses = customer.shipping_addresses; // Array of shipping addresses
  
  // Check if any shipping address is equal to billing address
  const isAddressEqual = checkIfAddressIsEqual(billing_address, shippingAddresses);
  console.log("isAddressEqual ",isAddressEqual)
  console.log("billing_address ",customer.billing_address)

  return (
    <>
      <div className="flex flex-col gap-4 mb-4 border border-ui-border-base rounded-rounded p-4">
        <button
          className="border border-ui-border-base rounded-rounded p-5 min-h-[100px] h-full w-full flex flex-col justify-between"
          onClick={() => {
            setAddressMethod("manual");
            openModal();
          }}
          data-testid="add-address-manual-button"
        >
          <span className="text-base-semi">Add Address Manually</span>
          <Plus />
        </button>

        <button
          className="border border-ui-border-base rounded-rounded p-5 min-h-[100px] h-full w-full flex flex-col justify-between"
          onClick={() => {
            setAddressMethod("map");
            openModal();
          }}
          data-testid="set-address-map-button"
        >
          <span className="text-base-semi">Set Address Using Map</span>
          <MapPin />
        </button>
        
        {!isAddressEqual && customer?.billing_address && (
       <button
       className="border border-ui-border-base rounded-rounded p-5 min-h-[100px] h-full w-full flex flex-col justify-between"
       onClick={() => {
         setUseBillingModalOpen(true); // Open the billing modal
       }}
       data-testid="use-billing-as-shipping-button"
     >
       <span className="text-base-semi">Use billing address as shipping address</span>
       <Plus />
     </button>
        )}
      </div>

      {addressMethod === "manual" && (
        <Modal isOpen={modalState} close={close} data-testid="add-address-modal">
          <Modal.Title>
            <Heading className="mb-2">Add address</Heading>
          </Modal.Title>
          <form action={formAction}>
            <Modal.Body>
              <div className="flex flex-col gap-y-2">
                {/* {customer?.billing_address && (
                  <div className="flex items-center gap-x-2">
                    <input
                      type="checkbox"
                      id="use-billing-address"
                      checked={useBillingAddress}
                      onChange={() => setUseBillingAddress(!useBillingAddress)}
                      data-testid="use-billing-address-checkbox"
                    />
                    <label htmlFor="use-billing-address" className="text-sm mt-4">
                      Use billing address as shipping address
                    </label>
                  </div>
                )} */}

                <div className="grid grid-cols-2 gap-x-2">
                  <Input
                    label="First name"
                    name="first_name"
                    defaultValue={billingAddress.first_name || ""}
                    required
                    autoComplete="given-name"
                    onChange={handleInputChange}
                    data-testid="first-name-input"
                  />
                  <Input
                    label="Last name"
                    name="last_name"
                    defaultValue={billingAddress.last_name || ""}
                    // required
                    autoComplete="family-name"
                    onChange={handleInputChange}
                    data-testid="last-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                {errors.first_name && <p className="text-red-500 text-xsmall-regular">{errors.first_name}</p>}
                {billingAddress.last_name && errors.last_name && <p className="text-red-500 text-xsmall-regular">{errors.last_name}</p>}
                </div>

                <Input
                  label="Location"
                  name="company"
                  defaultValue={billingAddress.company || ""}
                  required
                  autoComplete="organization"
                  onChange={handleInputChange}
                  data-testid="company-input"
                />
                  <Input
                  label="Landmark"
                  name="address_2"
                  defaultValue={billingAddress.address_2 || ""}
                  autoComplete="address-line2"
                  onChange={handleInputChange}
                  data-testid="address-2-input"
                />
                <Input
                  label="Address"
                  name="address_1"
                  defaultValue={billingAddress.address_1 || ""}
                  required
                  autoComplete="address-line1"
                  onChange={handleInputChange}
                  data-testid="address-1-input"
                />
                <div className="grid grid-cols-[144px_1fr] gap-x-2">
                  <Input
                    label="Postal code"
                    name="postal_code"
                    defaultValue={billingAddress.postal_code || ""}
                    required
                    autoComplete="postal-code"
                    onChange={handleInputChange}
                    data-testid="postal-code-input"
                  />
                  <Input
                    label="City"
                    name="city"
                    defaultValue={billingAddress.city || ""}
                    required
                    autoComplete="locality"
                    onChange={handleInputChange}
                    data-testid="city-input"
                  />
                </div>
                <div className="grid grid-cols-[144px_1fr] gap-x-2">
                {errors.postal_code && <p className="text-red-500 text-xsmall-regular">{errors.postal_code}</p>}
                {errors.city && <p className="text-red-500 text-xsmall-regular">{errors.city}</p>}
                </div>

                <Input
                  label="Province / State"
                  name="province"
                  defaultValue={billingAddress.province || ""}
                  required
                  autoComplete="address-level1"
                  onChange={handleInputChange}
                  data-testid="state-input"
                />
                {errors.province && <p className="text-red-500 text-xsmall-regular">{errors.province}</p>}
                <CountrySelect
                  region={region}
                  name="country_code"
                  value={selectedCountry} // Controlled value from state
                  onChange={handleCountryChange} // Handle country selection
                  required
                  autoComplete="country"
                  data-testid="country-select"
                />
                <Input
                  label="Phone"
                  name="phone"
                  defaultValue={billingAddress.phone || ""}
                  required
                  autoComplete="phone"
                  onChange={handleInputChange}
                  data-testid="phone-input"
                />
                {errors.phone && <p className="text-red-500 text-xsmall-regular">{errors.phone}</p>}
              </div>
              {formState.error && (
                <div className="text-rose-500 text-small-regular py-2" data-testid="address-error">
                  {formState.error}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <div className="flex gap-3 mt-6">
                <Button
                  type="reset"
                  variant="secondary"
                  onClick={close}
                  className="h-10"
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
                <SubmitButton data-testid="save-button" disabled={!isFormValid}>
                  Save
                </SubmitButton>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}

      {addressMethod === "map" && (
        <ProfileLocation
          modalState={modalState}
          closeModal={close}
          customerId={customer.id}
        />
      )}

<UseBillingAsShippingModal
        customer={customer}
        isOpen={useBillingModalOpen}
        onClose={() => setUseBillingModalOpen(false)}
      />
    </>
  );
};

export default AddAddress;
