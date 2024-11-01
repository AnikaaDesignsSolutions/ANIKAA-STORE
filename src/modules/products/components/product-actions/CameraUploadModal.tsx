"use client";

import React, { useState, useRef } from "react";
import { Modal, Box, Button, IconButton } from "@mui/material";
import axios from "axios"; // Axios for API requests
import X from "@modules/common/icons/x"; // Assuming you have an X icon component

type ImageCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (imageUrl: string) => void;
  productTitle: string;
};

const ImageCaptureModal = ({
  isOpen,
  onClose,
  onUpload,
  productTitle,
}: ImageCaptureModalProps) => {
  const [uploading, setUploading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  // Stop the camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Upload the image to the server using axios and get the URL
  const uploadImage = async (formData: FormData) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/designImageUpload`,
        formData
      );
      const data = response.data;
      if (data?.files?.image?.[0]?.url) {
        onUpload(data.files.image[0].url); // Pass the uploaded image URL to the parent component
        onClose();
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  // Capture the current frame from the video
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        );

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append("image", blob, "captured-image.png");
            setUploading(true);
            uploadImage(formData); // Upload the captured image
            stopCamera();
          }
        }, "image/png");
      }
    }
  };

  // Handle image upload from device
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file); // Append the file from input
      setUploading(true);
      uploadImage(formData); // Upload the selected image
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} aria-labelledby="modal-title">
      <Box
        sx={{
          width: { xs: "90vw", sm: "70vw", md: 400 },
          backgroundColor: "white",
          p: { xs: 2, md: 4 },
          margin: "auto",
          top: "50%",
          transform: "translateY(-50%)",
          position: "relative",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Close Button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "gray",
          }}
        >
          <X />
        </IconButton>

        <h2
          id="modal-title"
          style={{ marginBottom: "16px", fontSize: "1.2rem", textAlign: "center" }}
        >
          Capture or Upload an Image for {productTitle}
        </h2>

        {/* Camera Placeholder or Captured Image */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          {!cameraActive && (
            <img
              src="/in/dress-fashion-blogger.svg"
              alt="Fashion Blogger"
              style={{ width: "60%", height: "auto" }}
            />
          )}
        </div>

        {/* Video Element for Camera */}
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "auto",
            display: cameraActive ? "block" : "none",
          }}
        ></video>

        {/* Canvas Element to Capture Photo */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Capture and Camera Control Buttons */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          {!cameraActive ? (
            <Button
              onClick={startCamera}
              variant="contained"
              sx={{ backgroundColor: "#6e323b", color: "white", ":hover": { backgroundColor: "#56242e" } }}
            >
              Open Camera
            </Button>
          ) : (
            <>
              <Button
                onClick={capturePhoto}
                variant="contained"
                sx={{ backgroundColor: "#6e323b", color: "white", ":hover": { backgroundColor: "#56242e" }, marginRight: "10px" }}
              >
                Capture Now
              </Button>
              <Button
                onClick={stopCamera}
                variant="contained"
                sx={{ backgroundColor: "#d32f2f", color: "white", ":hover": { backgroundColor: "#b71c1c" } }}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Upload Image Section */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: "block", margin: "16px auto", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", width: "80%" }}
        />
        {uploading && <p style={{ textAlign: "center" }}>Uploading...</p>}
      </Box>
    </Modal>
  );
};

export default ImageCaptureModal;
