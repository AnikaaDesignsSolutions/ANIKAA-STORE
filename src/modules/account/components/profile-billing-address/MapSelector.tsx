"use client"

import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useMapEvents } from "react-leaflet"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLocation } from "@fortawesome/free-solid-svg-icons" // Import the location icon

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)

import "leaflet/dist/leaflet.css"

type MapSelectorProps = {
  currentPosition: [number, number] | null
  markerPosition: [number, number] | null
  setMarkerPosition: (position: [number, number]) => void
}

const MapSelector: React.FC<MapSelectorProps> = ({
  currentPosition,
  markerPosition,
  setMarkerPosition,
}) => {
  const [customIcon, setCustomIcon] = useState<any>(null)

  useEffect(() => {
    // Dynamically import 'leaflet' and create the custom icon
    const L = require("leaflet")

    // Fix icon paths for Leaflet's images
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })

    const customIcon = new L.Icon({
      iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
      iconSize: [38, 95],
      iconAnchor: [22, 94],
      popupAnchor: [-3, -76],
      shadowUrl: "https://leafletjs.com/examples/custom-icons/leaf-shadow.png",
      shadowSize: [50, 64],
      shadowAnchor: [4, 62],
    })

    setCustomIcon(customIcon)
  }, [])

  // Use the hook directly inside the component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng])
      },
    })
    return null
  }

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const latLng: [number, number] = [position.coords.latitude, position.coords.longitude]
        setMarkerPosition(latLng)
      })
    } else {
      console.error("Geolocation is not supported by this browser.")
    }
  }

  return (
    <div className="my-4 relative">
      <h3>Select Location on Map:</h3>
      {currentPosition ? (
        <div className="relative">
          {/* Map Container */}
          <MapContainer
            center={currentPosition}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; Anikaa Designs Solutions'
            />
            {markerPosition && customIcon && (
              <Marker position={markerPosition} icon={customIcon} />
            )}
            <MapClickHandler />
          </MapContainer>
          <button
  type="button"
  onClick={handleUseCurrentLocation}
  className="absolute top-3 right-3 text-white py-2 px-4 rounded shadow flex items-center gap-2"
  style={{ backgroundColor: '#fc8b9c', zIndex: 1000 }} // Set background color here
>
  <FontAwesomeIcon icon={faLocation} /> {/* Add the location icon */}
  Use Current Location
</button>

        </div>
      ) : (
        <p>Loading map...</p>
      )}
    </div>
  )
}

export default MapSelector
