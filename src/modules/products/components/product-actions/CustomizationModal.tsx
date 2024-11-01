"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, Button, TextField } from "@mui/material";
import X from "@modules/common/icons/x";
import SizeChartDialog from "../size-chart-dialog";
import axios from "axios";
import { MEDUSA_BACKEND_URL } from "@lib/config";

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  matchingItemId?: string;
  categoryId: string;
  initialMeasurements: { [key: string]: string };
}

interface ModalProps {
  onClose: () => void;
  productName: string;
}

const UploadImageSuccessModal: React.FC<ModalProps> = ({ onClose, productName }) => {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Success
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <img src="/dress-fashion-blogger.svg" alt="Dress Fashion Blogger" style={{ width: 80, marginBottom: 16 }} />
        <p>Design images for your <strong>{productName}</strong> have been uploaded successfully!</p>
      </DialogContent>
    </Dialog>
  );
};

const UploadPreferenceSuccessModal: React.FC<ModalProps> = ({ onClose, productName }) => {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Success
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <X />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <img src="/dress-fashion-blogger.svg" alt="Dress Fashion Blogger" style={{ width: 80, marginBottom: 16 }} />
        <p>Design preference for your <strong>{productName}</strong> has been updated successfully!</p>
      </DialogContent>
    </Dialog>
  );
};

const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  matchingItemId,
  categoryId,
  initialMeasurements,
}) => {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [materialImages, setMaterialImages] = useState<File[]>([]); // New state for material images
  const [designImages, setDesignImages] = useState<string[]>([]);
  const [materialImageUrls, setMaterialImageUrls] = useState<string[]>([]); // URLs for material images
  const [description, setDescription] = useState("");
  const [hasImageChanges, setHasImageChanges] = useState(false);
  const [hasMaterialImageChanges, setHasMaterialImageChanges] = useState(false); // For material images
  const [hasPreferenceChanges, setHasPreferenceChanges] = useState(false);
  const [showUploadImageSuccessModal, setShowUploadImageSuccessModal] = useState(false);
  const [showUploadPreferenceSuccessModal, setShowUploadPreferenceSuccessModal] = useState(false);
  const [measurements, setMeasurements] = useState<{ [key: string]: string }>({});

  const [isDialogOpen, setIsDialogOpen] = useState(false); // For SizeChartDialog

  console.log("matchingItem Id",matchingItemId)
  useEffect(() => {
    if (matchingItemId) {
      // Load existing preferences or images when modal opens (if applicable)
      // You can set default description and designImages from existing data here
    }
  }, [matchingItemId]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, isMaterial: boolean = false) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files);
      if (isMaterial) {
        setMaterialImages(fileList);
        setHasMaterialImageChanges(true);
      } else {
        setUploadedImages(fileList);
        setHasImageChanges(true);
      }
    }
  };

  const handleRemoveImage = (index: number, isMaterial: boolean = false) => {
    if (isMaterial) {
      setMaterialImages((prevImages) => prevImages.filter((_, i) => i !== index));
    } else {
      setUploadedImages((prevImages) => prevImages.filter((_, i) => i !== index));
    }
  };

  const handleRemoveDesignImage = (index: number) => {
    setDesignImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const uploadImages = async (imageFiles: File[]) => {
    const formData = new FormData();
    imageFiles.forEach((image, index) => {
      formData.append(`design_images_${index}`, image);
    });

    try {
      const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/designImageUpload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrls = response.data.files.map((file: any) => file.url);
      return imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error("Image upload failed");
    }
  };

  const updateDesignPreferenceForItem = async () => {
    if (!matchingItemId) return;

    const requestBody = {
      id: matchingItemId,
      design_preference: description,
      design_images: designImages,
    };

    try {
      await axios.post(`${MEDUSA_BACKEND_URL}/store/updateDesignPreference`, requestBody);
      setShowUploadPreferenceSuccessModal(true);
      setHasPreferenceChanges(false);
    } catch (error) {
      console.error("Error updating design preference:", error);
    }
  };
  
  const updateImagesForItem = async (isMaterial: boolean = false) => {
    if (!matchingItemId) return;

    let newImageUrls = [];
    if (isMaterial) {
      try {
        newImageUrls = await uploadImages(materialImages);
        setMaterialImageUrls(newImageUrls);
      } catch (error) {
        console.error("Failed to upload material images:", error);
        return;
      }
    } else {
      try {
        newImageUrls = await uploadImages(uploadedImages);
      } catch (error) {
        console.error("Failed to upload design images:", error);
        return;
      }
    }

    const requestBody = {
      id: matchingItemId,
      design_images: isMaterial ? undefined : [...designImages, ...newImageUrls],
      material_images: isMaterial ? [...materialImageUrls, ...newImageUrls] : undefined,
    };

    try {
      await axios.post(`${MEDUSA_BACKEND_URL}/store/updateDesignPreference`, requestBody);
      if (isMaterial) {
        setShowUploadPreferenceSuccessModal(true);
        setHasMaterialImageChanges(false);
      } else {
        setShowUploadImageSuccessModal(true);
        setHasImageChanges(false);
      }
    } catch (error) {
      console.error("Error updating design/material preferences:", error);
    }
  };

  const handleSubmitMeasurements = (newMeasurements: { [key: string]: string }) => {
    setMeasurements(newMeasurements);
    setIsDialogOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} fullScreen>
      <DialogTitle>
        Customize Your {productTitle}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <X />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <div className="flex flex-col gap-y-4">
          {showUploadImageSuccessModal && (
            <UploadImageSuccessModal
              onClose={() => setShowUploadImageSuccessModal(false)}
              productName={productTitle}
            />
          )}

          {showUploadPreferenceSuccessModal && (
            <UploadPreferenceSuccessModal
              onClose={() => setShowUploadPreferenceSuccessModal(false)}
              productName={productTitle}
            />
          )}

          <input
            type="file"
            accept="image/*"
            id="uploadDesign"
            style={{ display: "none" }}
            multiple
            onChange={(e) => handleImageUpload(e, false)}
          />
          <label
            htmlFor="uploadDesign"
            className="cursor-pointer text-center py-3 px-5 border-4 border-[#56242e] hover:border-[#e88b9a] hover:bg-[#e88b9a] hover:text-white shadow-md transition-all duration-300 w-full"
          >
            {designImages.length > 0 ? "Change Design's Photos" : "Upload Design's Photos"}
          </label>

          {/* Upload Material's Photos */}
          <input
            type="file"
            accept="image/*"
            id="uploadMaterial"
            style={{ display: "none" }}
            multiple
            onChange={(e) => handleImageUpload(e, true)}
          />
          <label
            htmlFor="uploadMaterial"
            className="cursor-pointer text-center py-3 px-5 border-4 border-[#56242e] hover:border-[#e88b9a] hover:bg-[#e88b9a] hover:text-white shadow-md transition-all duration-300 w-full"
          >
            {materialImages.length > 0 ? "Change Material's Photos" : "Upload Material's Photos"}
          </label>

          {/* Existing Design Images */}
          {designImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {designImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Existing Design ${index + 1}`}
                    className="w-full h-[150px] object-cover rounded-md"
                  />
                  <button
                    onClick={() => handleRemoveDesignImage(index)}
                    className="absolute top-2 right-2 text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Existing Material Images */}
          {materialImageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {materialImageUrls.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Material Image ${index + 1}`}
                    className="w-full h-[150px] object-cover rounded-md"
                  />
                  <button
                    onClick={() => handleRemoveImage(index, true)}
                    className="absolute top-2 right-2 text-white"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Changed Design Images */}
          {hasImageChanges && (
            <Button
              onClick={() => updateImagesForItem(false)}
              variant="contained"
              color="primary"
              fullWidth
            >
              Upload Changed Design Images
            </Button>
          )}

          {/* Upload Changed Material Images */}
          {hasMaterialImageChanges && (
            <Button
              onClick={() => updateImagesForItem(true)}
              variant="contained"
              color="primary"
              fullWidth
            >
              Upload Changed Material Images
            </Button>
          )}
        </div>

        {/* Design Preference Textarea */}
        <TextField
          multiline
          rows={4}
          fullWidth
          margin="normal"
          label="Enter your design preferences"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setHasPreferenceChanges(true);
          }}
        />

        {/* Update Design Preference */}
        {hasPreferenceChanges && (
          <Button
            onClick={updateDesignPreferenceForItem}
            variant="contained"
            color="secondary"
            fullWidth
          >
            Update Design Preference
          </Button>
        )}

        {/* Size Chart Dialog */}
        <div className="flex items-center gap-x-2 mt-4 mb-4">
          <Button variant="outlined" color="primary" onClick={() => setIsDialogOpen(true)}>
            Enter Your Measurements Here
          </Button>
        </div>

        <SizeChartDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          productTitle={productTitle}
          categoryId={categoryId}
          onSubmitMeasurements={handleSubmitMeasurements}
          initialMeasurements={initialMeasurements}
          matchingItemId={matchingItemId}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationModal;
