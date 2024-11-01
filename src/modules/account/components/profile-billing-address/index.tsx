"use client"

import { Customer, Region } from "@medusajs/medusa"
import React, { useEffect, useMemo, useState } from "react"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { updateCustomerBillingAddress } from "@modules/account/actions"
import MapSelector from "./MapSelector" // Import the MapSelector component
import { Button } from "@medusajs/ui"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Warning icon
import { MEDUSA_BACKEND_URL } from "@lib/config"

type MyInformationProps = {
  customer: Omit<Customer, "password_hash">
  regions: Region[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({
  customer,
  regions,
}) => {
  const regionOptions = useMemo(() => {
    return (
      regions
        ?.map((region) => {
          return region.countries.map((country) => ({
            value: country.iso_2,
            label: country.display_name,
          }))
        })
        .flat() || []
    )
  }, [regions])

  const [successState, setSuccessState] = useState(false)
  const [state, formAction] = useFormState(updateCustomerBillingAddress, {
    error: false,
    success: false,
  })

  // Capture the billing address id after it's updated
  const [billingAddressId, setBillingAddressId] = useState<string | null>(null)

  const clearState = () => {
    setSuccessState(false)
    setBillingAddressId(null) // Reset the billing address id when state is cleared
  }

  // Initial location for the map
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)

  const [addressData, setAddressData] = useState<any>(null) // Store the address data

  // Form field states
  const [address1, setAddress1] = useState<string>(customer.billing_address?.address_1 || "")
  const [countryCode, setCountryCode] = useState<string>(customer.billing_address?.country_code || "")
  const [city, setCity] = useState<string>(customer.billing_address?.city || "")
  const [postalCode, setPostalCode] = useState<string>(customer.billing_address?.postal_code || "")
  const [province, setProvince] = useState<string>(customer.billing_address?.province || "")
  const [latitude, setLatitude] = useState<string>(customer.billing_address?.latitude ? String(customer.billing_address.latitude) : "")
  const [longitude, setLongitude] = useState<string>(customer.billing_address?.longitude ? String(customer.billing_address.longitude) : "")

  useEffect(() => {
    // Check if latitude and longitude already exist in customer.billing_address
    if (customer.billing_address?.latitude && customer.billing_address?.longitude) {
      const latLng: [number, number] = [
        customer.billing_address.latitude,
        customer.billing_address.longitude,
      ]
      setCurrentPosition(latLng)
      setMarkerPosition(latLng)
    } else {
      // If no latitude and longitude exist, use browser geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          const latLng: [number, number] = [position.coords.latitude, position.coords.longitude]
          setCurrentPosition(latLng)
          setMarkerPosition(latLng)
        })
      }
    }
  }, [customer.billing_address])

  useEffect(() => {
    if (state.success) {
      setBillingAddressId(customer.billing_address_id)

      // Construct the request body to send to the API
      const requestBody = {
        customerId: customer.id, // Assuming customer has an `id` field
        addressId: customer.billing_address.id, // Use billing address id
        newAddress: {
          latitude: markerPosition ? markerPosition[0] : customer.billing_address.latitude,
          longitude: markerPosition ? markerPosition[1] : customer.billing_address.longitude,
          first_name: customer.billing_address.first_name,
          last_name: customer.billing_address.last_name,
          city: customer.billing_address.city,
          country_code: customer.billing_address.country_code,
          address_1: customer.billing_address.address_1,
          postal_code: customer.billing_address.postal_code,
          company: customer.billing_address.company,
          metadata: customer.billing_address.metadata,
        }
      }

      // POST request to your API to update the billing address with latitude and longitude
      fetch(`${MEDUSA_BACKEND_URL}/store/editLatitudeLongitude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(response => response.json())
        .then(data => {
          if (markerPosition) {
            setLatitude(String(markerPosition[0])) // Convert number to string
            setLongitude(String(markerPosition[1])) // Convert number to string
          }
        })
        .catch(error => {
          console.error('Error updating billing address:', error)
        })

      setSuccessState(true)
    }
  }, [state])

  const handleSetLocation = async () => {
    if (markerPosition) {
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${markerPosition[0]}&lon=${markerPosition[1]}`
      try {
        const response = await fetch(apiUrl)
        const data = await response.json()

        const addressComponents = [
          data.address.road,
          data.address.house_number,
          data.address.neighbourhood,
          data.address.city_district,
          data.address.suburb,
          data.address.village,
        ].filter(Boolean).join(", ")

        setAddress1(addressComponents)
        setCountryCode(data.address.country_code.toLowerCase())
        setCity(data.address.state_district)
        setPostalCode(data.address.postcode)
        setProvince(data.address.state)

        customer.billing_address.latitude = markerPosition[0]
        customer.billing_address.longitude = markerPosition[1]
      } catch (error) {
        console.error("Error fetching address data:", error)
      }
    } else {
      console.log("No location set.")
    }
  }

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latLng: [number, number] = [position.coords.latitude, position.coords.longitude]
        setCurrentPosition(latLng)
        setMarkerPosition(latLng)
      })
    } else {
      console.error("Geolocation is not supported by this browser.")
    }
  }

  const currentInfo = useMemo(() => {
    if (!customer.billing_address) {
      return "No billing address"
    }

    const country =
      regionOptions?.find(
        (country) => country.value === customer.billing_address.country_code
      )?.label || customer.billing_address.country_code?.toUpperCase()

    return (
      <div className="flex flex-col font-semibold" data-testid="current-info">
        <span>
          {customer.billing_address.first_name}{" "}
          {customer.billing_address.last_name}
        </span>
        <span>{customer.billing_address.company}</span>
        <span>
          {customer.billing_address.address_1}
          {customer.billing_address.address_2
            ? `, ${customer.billing_address.address_2}`
            : ""}
        </span>
        <span>
          {customer.billing_address.postal_code},{" "}
          {customer.billing_address.city}
        </span>
        <span>{country}</span>
      </div>
    )
  }, [customer, regionOptions])

  return (
    <form
      action={formAction}
      onReset={() => clearState()}
      className={`w-full ${!customer.billing_address ? 'border-red-500' : ''}`}
      style={{
        border: !customer.billing_address ? "1px solid red" : "",
        padding: !customer.billing_address ? "5px" : "",
      }}
    >
      <AccountInfo
        label="Billing address"
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={!!state.error}
        clearState={clearState}
        data-testid="account-billing-address-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          {/* Form inputs */}
          <div className="grid grid-cols-2 gap-x-2">
            <Input
              label="First name"
              name="billing_address.first_name"
              defaultValue={customer.billing_address?.first_name || undefined}
              required
              data-testid="billing-first-name-input"
            />
            <Input
              label="Last name"
              name="billing_address.last_name"
              defaultValue={customer.billing_address?.last_name || undefined}
              // required
              data-testid="billing-last-name-input"
            />
          </div>

          <Input
            label="Location Name"
            name="billing_address.company"
            defaultValue={customer.billing_address?.company || undefined}
            data-testid="billing-company-input"
          />

          {/* Render MapSelector component */}
          <MapSelector 
            currentPosition={currentPosition} 
            markerPosition={markerPosition} 
            setMarkerPosition={setMarkerPosition} 
          />

          {/* Button to use the current location */}
          {/* <Button
            type="button"
            onClick={handleUseCurrentLocation} // Handle current location click
            className="mt-4 p-3 text-md text-white"
            style={{
              backgroundColor: '#007bff',
              borderRadius: '4px',
            }}
          >
            Use Current Location
          </Button> */}

          {/* Display fetched address if available */}
          {addressData && (
            <div className="p-4 bg-gray-100 rounded">
              <h3>Address Information</h3>
              <p>Address: {address1}</p>
              <p>City: {city}</p>
              <p>Postal Code: {postalCode}</p>
              <p>Province: {province}</p>
              <p>Country Code: {countryCode}</p>
            </div>
          )}

          {/* Display the Billing Address ID if available */}
          {billingAddressId && (
            <div className="p-4 bg-green-100 rounded">
              <h3>Billing Address ID</h3>
              <p>ID: {billingAddressId}</p>
            </div>
          )}

          {/* Set Location Button */}
          <Button
            type="button"
            onClick={handleSetLocation}
            className="mt-2 mb-2 p-3 ml-6 text-md text-white"
            style={{
              backgroundColor: '#6e323b',  // setting the background color
              borderRadius: '0px',  // removing the border radius
              width: '120px',  // setting a fixed width
              height: '30px',  // setting a fixed height
            }}
          >
            Set Location
          </Button>

{address1 &&(
          <div className="flex items-center bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-2" role="alert">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-600" />
          <p className="text-sm">
            The address auto-filled from the map location may not match your actual address. Please double-check and update the fields with your correct address if necessary.
          </p>
        </div>
)}

<Input
            label="Landmark"
            name="billing_address.address_2"
            defaultValue={customer.billing_address?.address_2 || undefined}
            data-testid="billing-address-2-input"
          />
          <Input
            label="Address"
            name="billing_address.address_1"
            value={address1}
            required
            data-testid="billing-address-1-input"
            onChange={(e) => setAddress1(e.target.value)}
          />
          <div className="grid grid-cols-[144px_1fr] gap-x-2">
            <Input
              label="Postal code"
              name="billing_address.postal_code"
              value={postalCode}
              required
              data-testid="billing-postcal-code-input"
              onChange={(e) => setPostalCode(e.target.value)}
            />
            <Input
              label="City"
              name="billing_address.city"
              value={city}
              required
              data-testid="billing-city-input"
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <Input
            label="Province"
            name="billing_address.province"
            value={province}
            data-testid="billing-province-input"
            onChange={(e) => setProvince(e.target.value)}
          />
          <NativeSelect
            name="billing_address.country_code"
            value={countryCode}
            required
            data-testid="billing-country-code-select"
            onChange={(e) => setCountryCode(e.target.value)}
          >
            <option value="">-</option>
            {regionOptions.map((option, i) => {
              return (
                <option key={i} value={option.value}>
                  {option.label}
                </option>
              )
            })}
          </NativeSelect>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
