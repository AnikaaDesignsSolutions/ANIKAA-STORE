"use client"

import { Customer, Region } from "@medusajs/medusa"
import React, { useEffect, useMemo, useState } from "react"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { updateCustomerBillingAddress } from "@modules/account/actions"

// Import necessary Leaflet components
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Define a custom marker icon with the provided iconUrl
const customIcon = new L.Icon({
  iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
  iconSize: [38, 95], // size of the icon
  iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
  popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  shadowUrl: "https://leafletjs.com/examples/custom-icons/leaf-shadow.png",
  shadowSize: [50, 64], // size of the shadow
  shadowAnchor: [4, 62], // the same for the shadow
})

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

  const [successState, setSuccessState] = React.useState(false)
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

  useEffect(() => {
    if (state.success) {
      // Assuming `state` contains the response data with the new billing address id
        setBillingAddressId(customer.billing_address_id)
      
      // console.log("customer.billing_address ",customer.billing_address)
      // console.log("customer.billing_address_id ",customer.billing_address_id)


      // console.log("billingAddressId ",billingAddressId)
      setSuccessState(true)
    }
  }, [state])

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

  // Function to handle map clicks to set the marker
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng])
      },
    })
    return null
  }

  // Function to handle the "Set Location" button click
  const handleSetLocation = async () => {
    if (markerPosition) {
      // Use Nominatim (OpenStreetMap) Reverse Geocoding API to get address
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${markerPosition[0]}&lon=${markerPosition[1]}`

      try {
        const response = await fetch(apiUrl)
        const data = await response.json()

        // Exclude ISO3166-2-lvl4, country, country_code, state, and state_district from address1
        const addressComponents = [
          data.address.road,
          data.address.house_number,
          data.address.neighbourhood,
          data.address.city_district,
          data.address.suburb,
          data.address.village,
        ].filter(Boolean).join(", ")

        setAddress1(addressComponents)
        setCountryCode(data.address.country_code.toUpperCase())
        setCity(data.address.state_district)
        setPostalCode(data.address.postcode)
        setProvince(data.address.state)

        console.log("Changed location:", data)

        // Update customer.billing_address with latitude and longitude
        customer.billing_address.latitude = markerPosition[0]
        customer.billing_address.longitude = markerPosition[1]
      } catch (error) {
        console.error("Error fetching address data:", error)
      }
    } else {
      console.log("No location set.")
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

  console.log("customer ", customer.billing_address)

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
              required
              data-testid="billing-last-name-input"
            />
          </div>

          <Input
            label="Location Name"
            name="billing_address.company"
            defaultValue={customer.billing_address?.company || undefined}
            data-testid="billing-company-input"
          />

          {/* Map for selecting the location */}
          <div className="my-4">
            <h3>Select Location on Map:</h3>
            {currentPosition ? (
              <MapContainer
                center={currentPosition}
                zoom={13}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markerPosition && (
                  <Marker position={markerPosition} icon={customIcon} />
                )}
                <MapClickHandler />
              </MapContainer>
            ) : (
              <p>Loading map...</p>
            )}
          </div>

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
          <button
            type="button"
            onClick={handleSetLocation}
            className="mt-4 p-2 bg-blue-500 text-white rounded"
          >
            Set Location
          </button>

          <Input
            label="Address"
            name="billing_address.address_1"
            value={address1}
            required
            data-testid="billing-address-1-input"
            onChange={(e) => setAddress1(e.target.value)}
          />
          <Input
            label="Apartment, suite, etc."
            name="billing_address.address_2"
            defaultValue={customer.billing_address?.address_2 || undefined}
            data-testid="billing-address-2-input"
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
