"use client"

import { Customer } from "@medusajs/medusa"
import React, { useEffect, useState } from "react"
import { useFormState } from "react-dom"
import axios from "axios"

import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { updateCustomerPhone } from "@modules/account/actions"
import { phoneNumberPattern } from "@lib/util/regex"

type MyInformationProps = {
  customer: Omit<Customer, "password_hash">
}

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = useState(false)
  const [phoneValue, setPhoneValue] = useState(customer.phone || "")
  const [phoneError, setPhoneError] = useState("")
  const [isPhoneExisting, setIsPhoneExisting] = useState(false) // To track if phone number exists in the system

  // Initialize useFormState with action and initial state
  const [state, formAction] = useFormState(updateCustomerPhone, {
    success: false,
    error: null,  // Use a general error for form submission failure, if needed
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  // Handle phone input change
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPhoneValue(value)

    // Validate against the phone number pattern
    if (!phoneNumberPattern.test(value)) {
      setPhoneError("Phone number is invalid. Please enter a valid phone number.")
      setIsPhoneExisting(false)
    } else {
      setPhoneError("")
      
      // Check if the phone number already exists in the system using the API
      try {
        const response = await axios.get(
          `http://localhost:9000/store/getEmailforPassword`,
          {
            params: {
              phoneNo: value,
            },
          }
        )
        const data = response.data

        if (data.customer) {
          setIsPhoneExisting(true) // Set flag if customer exists with the phone number
          setPhoneError(`Phone number ${value} already exists. Please use a different one.`)
          setIsPhoneExisting(false)
        }
      } catch (error) {
        console.error("Error checking phone number:", error)
        setPhoneError("Unable to verify phone number. Please try again.")
        setIsPhoneExisting(false)
      }
    }
  }

  // Disable form submission if there is a validation error or phone number already exists
  const isFormInvalid = phoneError !== "" || phoneValue === "" || isPhoneExisting

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Only call formAction if the phone number does not already exist
    if (!isFormInvalid) {
      const formData = new FormData() // Create a FormData object
      formData.append("phone", phoneValue) // Append the phone value

      formAction(formData)  // Trigger the form submission using the correct dispatch
    }
  }

  return (
    <form
      onSubmit={handleSubmit} // Call handleSubmit on form submission
      className={`w-full ${!customer.phone ? "border border-red-500 p-2" : ""}`}
    >
      <AccountInfo
        label="Phone"
        currentInfo={`${customer.phone}`}
        isSuccess={successState}
        isError={!!state.error} // Show error state in UI
        errorMessage={state.error} // Display error message from form submission
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={phoneValue}
            onChange={handlePhoneChange}
            data-testid="phone-input"
          />
          {phoneError && (
            <span className="text-red-500 text-sm" data-testid="phone-error">
              {phoneError}
            </span>
          )}
        </div>
        {/* <div className="flex items-center justify-end mt-4">
          <button
            type="submit"
            className={`btn btn-primary ${isFormInvalid ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isFormInvalid} // Disable the button if form is invalid
            data-testid="save-button"
          >
            Save changes
          </button>
        </div> */}
      </AccountInfo>
    </form>
  )
}

export default ProfilePhone
