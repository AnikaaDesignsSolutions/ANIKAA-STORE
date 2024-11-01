"use client";

import React, { useEffect, useState } from "react";
import { PencilSquare as Edit, Trash } from "@medusajs/icons";
import { Button, Heading, Text, clx } from "@medusajs/ui";
import { Address, Region } from "@medusajs/medusa";

import useToggleState from "@lib/hooks/use-toggle-state";
import CountrySelect from "@modules/checkout/components/country-select";
import Input from "@modules/common/components/input";
import Modal from "@modules/common/components/modal";
import {
  deleteCustomerShippingAddress,
  updateCustomerShippingAddress,
} from "@modules/account/actions";
import Spinner from "@modules/common/icons/spinner";
import { useFormState } from "react-dom";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import MapModal from "./MapModal";
import { namePattern, cityPattern, postalCodePattern, phoneNumberPattern } from "@lib/util/regex";

type EditAddressProps = {
  region: Region;
  address: Omit<Address, "beforeInsert">; // Omit 'beforeInsert' from Address type
  isActive?: boolean;
};

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address: initialAddress, // Renamed the prop to avoid conflict with the local state variable
  isActive = false,
}) => {
  const [address, setAddress] = useState<Omit<Address, "beforeInsert">>(initialAddress); // Manage address state here
  const [removing, setRemoving] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const { state, open, close: closeModal } = useToggleState(false);

  const [formState, formAction] = useFormState(updateCustomerShippingAddress, {
    success: false,
    error: null,
    addressId: address.id,
  });

  const close = () => {
    setSuccessState(false);
    closeModal();
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

  const removeAddress = async () => {
    setRemoving(true);
    await deleteCustomerShippingAddress(address.id);
    setRemoving(false);
  };

  const [errors, setErrors] = useState({
    first_name: "",
    last_name: "",
    postal_code: "",
    city: "",
    province: "",
    phone: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = "";
  
    switch (name) {
      case "first_name":
        if (!namePattern.test(value)) {
          error = "First Name should only contain alphabets";
        }
        break;
      case "last_name":
        if (value && !namePattern.test(value)) {
          // Only validate last_name if a value is entered
          error = "Last Name should only contain alphabets";
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
        if (!cityPattern.test(value)) {
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
  
    setErrors((prev) => ({ ...prev, [name]: error }));
  
    // After setting the error, check if the form is valid
    checkFormValidity({ ...errors, [name]: error }, { ...address, [name]: value });
  };
 

  const checkFormValidity = (updatedErrors: typeof errors, updatedAddress: typeof address) => {
    const isValid = 
      !Object.values(updatedErrors).some((error) => error !== "") && // No errors in form
      !!updatedAddress.first_name && // Check if required fields are filled
      !!updatedAddress.postal_code &&
      !!updatedAddress.city &&
      !!updatedAddress.phone;
    
    setIsFormValid(isValid); // Set form validity
  };
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress({ ...address, [name]: value });
    validateField(name, value); // Validate field as user types
  };

  // console.log("address ",address)
  return (
    <>
      <div
        className={clx(
          "border rounded-rounded p-5 min-h-[220px] h-full w-full flex flex-col justify-between transition-colors",
          {
            "border-gray-900": isActive,
          }
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col">
          <Heading className="text-left text-base-semi" data-testid="address-name">
            {address.first_name} {address.last_name}
          </Heading>
          {address.company && (
            <Text className="txt-compact-small text-ui-fg-base" data-testid="address-company">
              {address.company}
            </Text>
          )}
          <Text className="flex flex-col text-left text-base-regular mt-2">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city">
              {address.postal_code}, {address.city}
            </span>
            <span data-testid="address-province-country">
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
          </Text>
        </div>
        <div className="flex items-center gap-x-4">
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            Edit
          </button>
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={removeAddress}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash />}
            Remove
          </button>
        </div>
      </div>

      {address.latitude && address.longitude ? (
        <MapModal address={address} open={state} onClose={close} />
      ) : (
        <Modal isOpen={state} close={close} data-testid="edit-address-modal" >
          <Modal.Title>
            <Heading className="mb-2">Edit address</Heading>
          </Modal.Title>
          <form action={formAction}>
            <Modal.Body>
              <div className="grid grid-cols-1 gap-y-2">
                <div className="grid grid-cols-2 gap-x-2">
                  <Input
                    label="First name"
                    name="first_name"
                    required
                    autoComplete="given-name"
                    defaultValue={address.first_name || undefined}
                    onChange={handleInputChange}
                    data-testid="first-name-input"
                  />                  
                  <Input
                    label="Last name"
                    name="last_name"
                    // required
                    autoComplete="family-name"
                    defaultValue={address.last_name || undefined}
                    onChange={handleInputChange}
                    data-testid="last-name-input"
                  />
                 
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                {errors.first_name && (
                    <p className="text-red-500 text-xsmall-regular">{errors.first_name}</p>
                  )}
                {errors.last_name && (
                    <p className="text-red-500 text-xsmall-regular">{errors.last_name}</p>
                  )}
                </div>
                <Input
                  label="Location Name"
                  name="company"
                  autoComplete="organization"
                  defaultValue={address.company || undefined}
                  onChange={handleInputChange}
                  data-testid="company-input"
                />
                                <Input
                  label="Landmark"
                  name="address_2"
                  autoComplete="address-line2"
                  defaultValue={address.address_2 || undefined}
                  onChange={handleInputChange}
                  data-testid="address-2-input"
                />
                <Input
                  label="Address"
                  name="address_1"
                  required
                  autoComplete="address-line1"
                  defaultValue={address.address_1 || undefined}
                  onChange={handleInputChange}
                  data-testid="address-1-input"
                />
                <div className="grid grid-cols-[144px_1fr] gap-x-2">
                  <Input
                    label="Postal code"
                    name="postal_code"
                    required
                    autoComplete="postal-code"
                    defaultValue={address.postal_code || undefined}
                    onChange={handleInputChange}
                    data-testid="postal-code-input"
                  />
                  <Input
                    label="City"
                    name="city"
                    required
                    autoComplete="locality"
                    defaultValue={address.city || undefined}
                    onChange={handleInputChange}
                    data-testid="city-input"
                  />                
                </div>
                <div className="grid grid-cols-[144px_1fr] gap-x-2">
                {errors.postal_code && (
                    <p className="text-red-500 text-xsmall-regular">{errors.postal_code}</p>
                  )}
                {errors.city && (
                    <p className="text-red-500 text-xsmall-regular">{errors.city}</p>
                  )}
                </div>
                <Input
                  label="Province / State"
                  name="province"
                  autoComplete="address-level1"
                  defaultValue={address.province || undefined}
                  onChange={handleInputChange}
                  data-testid="state-input"
                />
                 {errors.province && (
                    <p className="text-red-500 text-xsmall-regular">{errors.province}</p>
                  )}
                <CountrySelect
                  name="country_code"
                  region={region}
                  value={address.country_code || ""} // Controlled value
                  onChange={(e) =>
                    setAddress({ ...address, country_code: e.target.value }) // Handle onChange event
                  }
                  required
                  autoComplete="country"
                  data-testid="country-select"
                />
                <Input
                  label="Phone"
                  name="phone"
                  autoComplete="phone"
                  defaultValue={address.phone || undefined}
                  onChange={handleInputChange}
                  data-testid="phone-input"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xsmall-regular">{errors.phone}</p>
                )}
              </div>
              {formState.error && (
                <div className="text-rose-500 text-small-regular py-2">
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
                <SubmitButton
                  data-testid="save-button"
                  disabled={!isFormValid} // Disable the button when form is invalid
                >
                  Save
                </SubmitButton>
              </div>
            </Modal.Footer>
          </form>
        </Modal>
      )}
    </>
  );
};

export default EditAddress;
