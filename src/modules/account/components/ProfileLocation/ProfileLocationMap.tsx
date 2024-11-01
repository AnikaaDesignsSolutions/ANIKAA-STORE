import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type ProfileLocationMapProps = {
  position: { lat: number; lng: number } | null;
  setPosition: (position: { lat: number; lng: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
};

const ProfileLocationMap: React.FC<ProfileLocationMapProps> = ({
  position,
  setPosition,
  zoom,
  setZoom,
}) => {
  // Map click event to set position
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        setZoom(15); // Zoom in to the location where the user clicked
        console.log("Selected Coordinates:", e.latlng);
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

  // Component to update map center and zoom when position changes
  const UpdateMapCenter = () => {
    const map = useMap();
    useEffect(() => {
      if (position) {
        map.setView([position.lat, position.lng], zoom);
      }
    }, [position, zoom, map]);

    return null;
  };

  return (
    <MapContainer
      center={position || { lat: 28.6139, lng: 77.209 }}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; Anikaa Designs Solutions'
      />
      <LocationMarker />
      <UpdateMapCenter />
    </MapContainer>
  );
};

export default ProfileLocationMap;
