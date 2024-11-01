import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@medusajs/ui";

type EditLocationMapProps = {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
};

const EditLocationMap: React.FC<EditLocationMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  isEditing,
  setIsEditing,
}) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    latitude !== null && longitude !== null
      ? { lat: latitude, lng: longitude }
      : null
  );

  // Handle map click event to update position
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        if (isEditing) {
          setPosition(e.latlng);
        }
      },
    });

    return position ? (
      <Marker
        position={position}
        icon={L.icon({
          iconUrl: "https://leafletjs.com/examples/custom-icons/leaf-green.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })}
      />
    ) : null;
  };

  // Update map center and zoom
  const UpdateMapCenter = () => {
    const map = useMap();
    useEffect(() => {
      if (position) {
        map.setView([position.lat, position.lng], 15);
      }
    }, [position, map]);

    return null;
  };

  return (
    <div style={{ height: "400px", position: "relative" }}>
      {position && !isEditing && (
        <Button
          variant="primary"
          onClick={() => setIsEditing(true)}
          style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1000 }}
        >
          Edit Location
        </Button>
      )}
      {position && isEditing && (
        <Button
          variant="primary"
          onClick={() => {
            onLocationChange(position.lat, position.lng);
            setIsEditing(false);
          }}
          style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1000 }}
        >
          Confirm Location
        </Button>
      )}
      <MapContainer
        center={position || { lat: 28.6139, lng: 77.209 }}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; Anikaa Designs Solutions'
        />
        <LocationMarker />
        <UpdateMapCenter />
      </MapContainer>
    </div>
  );
};

export default EditLocationMap;
