"use client";


import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Modal, Box, Button, IconButton, Checkbox, FormControlLabel, Radio, RadioGroup, Collapse } from "@mui/material";
import X from "@modules/common/icons/x"; // Assuming you have an X icon component
import { MEDUSA_BACKEND_URL } from "@lib/config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useParams } from "next/navigation";
import { addToCart, retrieveCart, updateLineItem } from "@modules/cart/actions";
import { LineItem } from "@medusajs/medusa";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { SelectChangeEvent } from "@mui/material/Select";
import { fetchCustomerData } from "./getCustomerData"

type LineItemWithDesign = {
  material_design_data?: Record<string, any>; // Define this according to your actual structure
} & LineItem; // Extending the existing LineItem type

// Define `ProductAttributes` for nested attributes
interface ProductAttributes {
  [attribute: string]: number;
}

interface CustomerProductData {
  customerName: string;
  productName: string; // add this to match your data structure
  attributes: ProductAttributes;
}


const DesignPreferencesModal = ({
  isOpen,
  onClose,
  onSubmit,
  categoryId,
  lineItemId,
  productTitle,
  designPreferences,
  materialImageUrl, 
  matchingItem,
  variant
}: any) => {
  const [formValues, setFormValues] = useState(designPreferences.measurement_values || {});
  const [designImages, setDesignImages] = useState<string[]>(designPreferences.design_images || []);
  const [measurementDressImages, setMeasurementDressImages] = useState<string[]>(designPreferences.measurement_dress_images || []);
  const [designPreference, setDesignPreference] = useState(designPreferences.design_preference || "");
  const [measurements, setMeasurements] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDressImages, setUploadingDressImages] = useState(false);
  const [attachLining, setAttachLining] = useState(designPreferences.attach_lining || false); 
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDesignImageWarning, setShowDesignImageWarning] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // Confirmation modal state
  const [showLiningModal, setShowLiningModal] = useState(false); // Lining confirmation modal state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // State for showing the delete confirmation dialog
  const [deleteTarget, setDeleteTarget] = useState(""); // To track whether we are deleting dress images or values
  const [deleteType, setDeleteType] = useState(""); // Track if we're deleting dress images or measurement values
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false); // New delete confirmation modal state

  // State for audio and video files (stored locally, not in DB)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isFullScreenVideoOpen, setIsFullScreenVideoOpen] = useState(false); // State to track full-screen video modal

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null); // Video stream reference

  const [showAudioHelp, setShowAudioHelp] = useState(false);
  const [showVideoHelp, setShowVideoHelp] = useState(false);

  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [capturedDressImages, setCapturedDressImages] = useState<string[]>([]);
  const [isCapturingDress, setIsCapturingDress] = useState(false);
  const [cameraDressStream, setCameraDressStream] = useState<MediaStream | null>(null);
  const videoDressRef = useRef<HTMLVideoElement | null>(null);
  const canvasDressRef = useRef<HTMLCanvasElement | null>(null);

  const [cart, setCart] = useState<any>(null);
  const [matchingItemId, setMatchingItemId] = useState<string | null>(null); // New state variable for matching item ID
  const countryCode = useParams().countryCode as string;

  const [customerProducts, setCustomerProducts] = useState<CustomerProductData[]>([]);
  const [selectedCustomerProduct, setSelectedCustomerProduct] = useState<string>("");


  const toggleAudioHelp = () => setShowAudioHelp(!showAudioHelp);
  const toggleVideoHelp = () => setShowVideoHelp(!showVideoHelp);
  // console.log("designpreferencesmodal variant ",variant)

  const buttonStyle = {
    background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", // Gradient background
    color: "white",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.4)", // Add shadow for enabled buttons
    border: "none",
    ":hover": {
      backgroundColor: "#fc798d", // Hover effect with the specified color
    },
    padding: "8px 16px",
    fontSize: "0.9rem",
    borderRadius: "4px", // Optional rounding
  };
  
  
  useEffect(() => {
    const fetchAllDesignPreferences = async () => {
      const cartData = await retrieveCart();
      setCart(cartData);
    };
  
      fetchAllDesignPreferences();
    
  }, [variant]); // Run this effect whenever `variants` or `localChanges` changes
  
  useEffect(() => {
    if (cart && materialImageUrl) {
      // Find the item where material_design_data has the key equal to materialImageUrl
      const matchingItem = cart.items.find((item: LineItemWithDesign) => 
        item.material_design_data && item.material_design_data[materialImageUrl]
      );

      if (matchingItem) {
        setMatchingItemId(matchingItem.id); // Set the matching item ID to the state variable
        // console.log("Matching Item ID:", matchingItem.id);
      } else {
        setMatchingItemId(null); // Reset if no matching item is found
        // console.log("No matching item found with the specified material image URL.");
      }
    }
  }, [cart, materialImageUrl]);  

  useEffect(() => {
    if (designPreferences) {
      setFormValues(designPreferences.measurement_values || {});
      setDesignImages(designPreferences.design_images || []);
      setMeasurementDressImages(designPreferences.measurement_dress_images || []);
      setDesignPreference(designPreferences.design_preference || "");
      setAttachLining(designPreferences.attach_lining || false);
    }
  }, [designPreferences]);

  useEffect(() => {
    // When modal opens, reset the audio and video for the corresponding materialImageUrl
    if (isOpen && materialImageUrl) {
      // Reset audio and video to existing preferences (if any)
      setAudioUrl(designPreferences.design_preference_audio || null);
      setVideoUrl(designPreferences.design_preference_video || null);
    }
  }, [isOpen, materialImageUrl, designPreferences]);

  // console.log("designpreferences ",designPreferences)
  const [measurementOption, setMeasurementOption] = useState("enter"); // Default option to enter measurements manually

  useEffect(() => {
    if (isOpen && categoryId) {
      const fetchMeasurements = async () => {
        try {
          const response = await axios.get(`${MEDUSA_BACKEND_URL}/store/categoryMeasurement?category_id=${categoryId}`);
          const data = response.data.data[0]?.measurements || [];

          // console.log("fetchMeasurements ",data)
          setMeasurements(data);
        } catch (error) {
          console.error("Error fetching measurements:", error);
        }
      };
      fetchMeasurements();
    }
  }, [isOpen, categoryId]);


  useEffect(() => {
    if (isOpen) {
      setCapturedDressImages([]);
      setIsCapturingDress(false);

      setCapturedImages([]);
      setIsCapturing(false);

      // Check if there is at least one measurement dress image
      const hasAtLeastOneDressImage = measurementDressImages.length > 0;

      // Check if all fields in the measurement table are filled with values greater than 0
      const allFieldsFilled = measurements.every(
        ({ attributeName }: any) => formValues[attributeName] && Number(formValues[attributeName]) > 0
      );

      // Set measurement option accordingly
      if (hasAtLeastOneDressImage) {
        setMeasurementOption("upload");
      } else if (allFieldsFilled) {
        setMeasurementOption("enter");
      } else {
        setMeasurementOption("enter"); // Default to enter if neither is satisfied
      }
    }
  }, [isOpen]);


  useEffect(() => {
    const fetchCustomerProducts = async () => {
      try {
        const fetchedCustomer = await fetchCustomerData();

        const customerId = fetchedCustomer?.id;
        // console.log("cart ",cart)

        // console.log("customerId ",customerId)
        const response = await axios.get(`${MEDUSA_BACKEND_URL}/store/customer_product_measurements?id=${customerId}`);
        const data = response.data.customer_product_measurement;
  
        // console.log("Full fetchCustomerProducts data:", data);
  
        // Transform and filter data to include only customer names with matching productName
        const filteredCustomerData: CustomerProductData[] = Object.entries(data as Record<string, { [productName: string]: ProductAttributes }>)
        .flatMap(([customerName, products]) =>
          Object.entries(products)
            .filter(([name]) => name === productTitle)
            .map(([productName, attributes]) => ({
              customerName,
              productName,
              attributes,
            }))
        );  
  
        // console.log("Filtered Customer Data:", filteredCustomerData);
        setCustomerProducts(filteredCustomerData); // Update with `CustomerProductData[]`
      } catch (error) {
        console.error("Error fetching customer product measurements:", error);
      }
    };
  
    if (measurementOption === "enter") {
      fetchCustomerProducts();
    }
  }, [measurementOption, productTitle]);
  // console.log("customrr ",lineItemId)
  // console.log("customrr cart ",cart)

  const handleCustomerProductSelect = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value as string;
    setSelectedCustomerProduct(selectedValue);
  
    // Split the selected value to get the customer and product name
    const [selectedCustomerName, selectedProductName] = selectedValue.split("-");
  
    // Find the selected customer's measurement data for the product
    const selectedData = customerProducts.find(
      ({ customerName, productName }) =>
        customerName === selectedCustomerName && productName === selectedProductName
    );
  
    if (selectedData) {
      const updatedFormValues: Record<string, number> = { ...formValues };
  
      Object.keys(selectedData.attributes).forEach((attribute) => {
        if (measurements.some((measurement: any) => measurement.attributeName === attribute)) {
          updatedFormValues[attribute] = selectedData.attributes[attribute];
        }
      });
  
      setFormValues(updatedFormValues);
    }
  };
   // Function to start the camera for capturing
   const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing the camera:", error);
    }
  };

     // Function to start the camera for capturing measuremtn dress
     const startDressCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraDressStream(stream);
        if (videoDressRef.current) {
          videoDressRef.current.srcObject = stream;
          videoDressRef.current.play();
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
      }
    };

  // Function to stop the camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

    // Function to stop the camera stream for measuremtn dress
    const stopDressCamera = () => {
      if (cameraDressStream) {
        cameraDressStream.getTracks().forEach((track) => track.stop());
        setCameraDressStream(null);
      }
    };

  // Function to capture image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageUrl = canvas.toDataURL("image/png");
        uploadCapturedImage(imageUrl); // Upload the captured image
      }
    }
  };

    // Function to capture image measuremtn dress
    const captureDressImage = () => {
      if (videoDressRef.current && canvasDressRef.current) {
        const canvas = canvasDressRef.current;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(videoDressRef.current, 0, 0, canvas.width, canvas.height);
          const imageUrl = canvas.toDataURL("image/png");
          uploadCapturedDressImage(imageUrl); // Upload the captured image
        }
      }
    };
  

  // Function to upload captured image
  const uploadCapturedImage = async (imageUrl: string) => {
    setUploadingImages(true);
    const blob = await fetch(imageUrl).then((res) => res.blob());
    const formData = new FormData();
    formData.append("image", blob, "captured-image.png");

    try {
      const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/designImageUpload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrlFromServer = response.data.files.image[0].url;
      setCapturedImages((prevImages) => [...prevImages, imageUrlFromServer]);
    } catch (error) {
      console.error("Error uploading captured image:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  // Function to upload captured image measuremtn dress
  const uploadCapturedDressImage = async (imageUrl: string) => {
    setUploadingDressImages(true);
    const blob = await fetch(imageUrl).then((res) => res.blob());
    const formData = new FormData();
    formData.append("image", blob, "captured-image.png");

    try {
      const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/designImageUpload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrlFromServer = response.data.files.image[0].url;
      setCapturedDressImages((prevImages) => [...prevImages, imageUrlFromServer]);
    } catch (error) {
      console.error("Error uploading captured image:", error);
    } finally {
      setUploadingDressImages(false);

    }
  };

  // console.log("capturedImages ",capturedImages)
  // console.log("capturedDressImages ",capturedDressImages)

   // Handle audio recording
   const startAudioRecording = () => {
    if (audioFile) {
      setAudioFile(null); // Reset previous audio
    }

    setIsRecording(true);
    audioChunksRef.current = [];

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const recordedAudioFile = new File([audioBlob], "recording.wav", { type: "audio/wav" });
        setAudioFile(recordedAudioFile);
        setAudioUrl(URL.createObjectURL(recordedAudioFile)); // Generate local URL for audio
        stream.getTracks().forEach((track) => track.stop()); // Stop audio stream
        setIsRecording(false);
      };

      mediaRecorder.start();
    });
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Handle video recording
  const startVideoRecording = async () => {
    if (videoFile) {
      setVideoFile(null); // Reset previous video
    }

    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(videoStream);

    // Ensure the video element is ready
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = videoStream; // Set the video stream
      videoElementRef.current.play();
    }

    const mediaRecorder = new MediaRecorder(videoStream);
    mediaRecorderRef.current = mediaRecorder;
    videoChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        videoChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });
      const recordedVideoFile = new File([videoBlob], "recording.webm", { type: "video/webm" });
      setVideoFile(recordedVideoFile);
      stopStream(videoStream); // Stop the video stream
      setVideoUrl(URL.createObjectURL(recordedVideoFile)); // Generate local URL for video
      videoStream.getTracks().forEach((track) => track.stop()); // Stop video stream
      setIsRecordingVideo(false);
    };

    mediaRecorder.start();
    setIsRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

    // Stop the video stream tracks
    const stopStream = (videoStream: MediaStream) => {
      videoStream.getTracks().forEach((track) => track.stop());
      setStream(null);
    };

    
    
  // Handle audio upload
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file)); // Generate local URL for uploaded audio
    }
  };

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file)); // Generate local URL for uploaded video
    }
  };


  // Upload video file to server
  // const handleVideoSubmit = async () => {
  //   if (videoFile) {
  //     setUploadingVideo(true);
  //     const formData = new FormData();
  //     formData.append("video-file", videoFile);

  //     try {
  //       const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/uploadVideoFile`, formData, {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       });
  //       console.log("Video uploaded successfully:", response.data);
  //     } catch (error) {
  //       console.error("Error uploading video file:", error);
  //     } finally {
  //       setUploadingVideo(false);
  //     }
  //   }
  // };

  // Handle video upload from device
  // const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     // Clear recorded video (if any) when a new video is uploaded
  //     if (isRecordingVideo) {
  //       stopVideoRecording();
  //       console.log("Recording stopped as user chose to upload a video.");
  //     }
  //     setVideoFile(file);
  //   }
  // };

  const uploadCapturedDesignImages = async () => {
    if (capturedImages.length === 0) return;
  
  
    // Append the uploaded images to the designImages array
    setDesignImages((prevImages) => [...prevImages, ...capturedImages]);
  
    setUploadingImages(false);
  };
  
  const uploadCapturedDressImages = async () => {
    if (capturedDressImages.length === 0) return;
  
  
    // Append the uploaded images to the designImages array
    setMeasurementDressImages((prevImages) => [...prevImages, ...capturedDressImages]);
  
    setUploadingDressImages(false);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "design" | "dress") => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (type === "design") setUploadingImages(true);
    if (type === "dress") setUploadingDressImages(true);

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/designImageUpload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return response.data.files.image[0].url;
        } catch (error) {
          console.error("Error uploading image:", error);
          return "";
        }
      })
    );

    const validImageUrls = imageUrls.filter((url) => url);

    if (type === "design") {
      setDesignImages((prevImages) => [...prevImages, ...validImageUrls]);
    } else {
      setMeasurementDressImages((prevImages) => [...prevImages, ...validImageUrls]);
    }

    if (type === "design") setUploadingImages(false);
    if (type === "dress") setUploadingDressImages(false);
  };

  // console.log("designPreference ",designPreferences)
  const handleDeleteConfirm = () => {
    if (deleteTarget === "dress") {
      setMeasurementDressImages([]); // Clear dress images
    } else if (deleteTarget === "values") {
      setFormValues({}); // Clear measurement values
    }
    setShowDeleteDialog(false); // Close the dialog
    setMeasurementOption(deleteTarget === "dress" ? "enter" : "upload"); // Switch to the other option
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false); // Close the dialog without deleting
  };

  const handleRemoveImage = async (index: number, type: "design" | "dress") => {
    const selectedImageUrl = type === "design" ? designImages[index] : measurementDressImages[index];

    if (type === "design") {
      setDesignImages((prevImages) => prevImages.filter((_, i) => i !== index));
    } else {
      setMeasurementDressImages((prevImages) => prevImages.filter((_, i) => i !== index));
    }

    const reqBody = {
      image_urls: [selectedImageUrl], 
    };

    try {
      const response = await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteImage`, { data: reqBody });

      if (response.status === 200) {
        // console.log("Image deleted successfully:", selectedImageUrl);
      } else {
        console.log("Failed to delete the image:", selectedImageUrl);
      }
    } catch (error) {
      console.error("Error deleting the image:", error);
    }
  };


  const handleCapturedRemoveImage = async (index: number, type: "design" | "dress") => {
    const selectedImageUrl = type === "design" ? capturedImages[index] : capturedDressImages[index];

    if (type === "design") {
      setCapturedImages((prevImages) => prevImages.filter((_, i) => i !== index));
    } else {
      setCapturedDressImages((prevImages) => prevImages.filter((_, i) => i !== index));
    }

    const reqBody = {
      image_urls: [selectedImageUrl], 
    };

    try {
      const response = await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteImage`, { data: reqBody });

      if (response.status === 200) {
        // console.log("Image deleted successfully:", selectedImageUrl);
      } else {
        console.log("Failed to delete the image:", selectedImageUrl);
      }
    } catch (error) {
      console.error("Error deleting the image:", error);
    }
  };


  // Define a delete function for audio or video files
  const deleteMediaFile = async (mediaUrl: string, type: "audio" | "video") => {
    const reqBody = {
    [`${type}Url`]: mediaUrl,  // either audioUrl or videoUrl based on type
  };
  if (type === "audio") {
    setAudioFile(null);
    setAudioUrl(null);
  } else if (type === "video") {
    setVideoFile(null);
    setVideoUrl(null);
  }
  try {
    const response = await axios.delete(`${MEDUSA_BACKEND_URL}/store/deleteImage`, { data: reqBody });
    if (response.status === 200) {
      console.log(`${type} deleted successfully`);
     
    } else {
      console.error(`Failed to delete ${type}:`, mediaUrl);
    }
  } catch (error) {
    console.error(`Error deleting the ${type}:`, error);
  }
};


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleDesignPreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDesignPreference(e.target.value);
  };

  const validateForm = () => {
    const allFieldsFilled = measurements.every(
      ({ attributeName }: any) => formValues[attributeName] && Number(formValues[attributeName]) > 0
    );
    const hasAtLeastOneDressImage = measurementDressImages.length > 0;
    const hasAtLeastOneDesignImage = designImages.length > 0;

    // console.log("")
    return { valid: hasAtLeastOneDressImage || (allFieldsFilled && hasAtLeastOneDesignImage), hasAtLeastOneDesignImage };
  };

  const handleSubmit = async () => {
    const { valid: formIsValid, hasAtLeastOneDesignImage } = validateForm();

    if (!formIsValid) {
      setShowWarningModal(true);
      return;
    }

    if (!hasAtLeastOneDesignImage) {
      setShowDesignImageWarning(true); 
      return;
    }

    // Show confirmation modal before final submit
    handleConfirmSubmit();
  };

  // Handle final form submission
  const handleConfirmSubmit = async () => {
    let finalAudioUrl = audioUrl;
    let finalVideoUrl = videoUrl;

    // Upload new audio file if present
    if (audioFile) {
      const formData = new FormData();
      formData.append("audio-file", audioFile);

      try {
        const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/uploadAudioFile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalAudioUrl = response.data.files["audio-file"][0].url;
      } catch (error) {
        console.error("Error uploading audio file:", error);
      }
    }

    // Upload new video file if present
    if (videoFile) {
      const formData = new FormData();
      formData.append("video-file", videoFile);

      try {
        const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/uploadVideoFile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalVideoUrl = response.data.files["video-file"][0].url;
      } catch (error) {
        console.error("Error uploading video file:", error);
      }
    }

    const response=    await addToCart({
      variantId: variant?.id,
      quantity: 1,
      countryCode,
    });

    const cartData = await retrieveCart();

    console.log("cartData ",cartData)

    const lineItemId = cartData?.items.find((item: LineItemWithDesign) => item.variant_id === variant?.id);

    console.log("lineItemId ",lineItemId)

    let liningStatus = false;
    if(variant?.title === "With Lining")
    {
      console.log("With Lining ")
      liningStatus = true;
    }

    const postData = {
      id: lineItemId?.id,
      material_image_url: materialImageUrl,
      design_preference: designPreference,
      design_images: designImages,
      measurement_values: formValues,
      measurement_dress_images: measurementDressImages,
      attach_lining: liningStatus,
      design_preference_audio: finalAudioUrl, // Updated audio URL
      design_preference_video: finalVideoUrl, // Updated video URL
    };

    try {
      await axios.post(`${MEDUSA_BACKEND_URL}/store/customizeDesign`, postData);
      setShowConfirmationModal(false); // Close confirmation modal


      console.log("response addtocart ",response)
      onSubmit(postData);
    } catch (error) {
      console.error("Error submitting design preferences:", error);
    }
  };
   // console.log("lineItemId ",lineItemId)

  useEffect(() => {
    // Check if the lineItemId.variant.title is equal to "With Lining"

    if (variant?.title === "With Lining") {
      setAttachLining(true);
    } else {
      setAttachLining(false);
    }
  }, [variant]);

  const handleConfirmEdit = async() => {
    setShowLiningModal(false); // Close lining modal
    
    let finalAudioUrl = audioUrl;
    let finalVideoUrl = videoUrl;

    // Upload new audio file if present
    if (audioFile) {
      const formData = new FormData();
      formData.append("audio-file", audioFile);

      try {
        const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/uploadAudioFile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalAudioUrl = response.data.files["audio-file"][0].url;
      } catch (error) {
        console.error("Error uploading audio file:", error);
      }
    }

    // Upload new video file if present
    if (videoFile) {
      const formData = new FormData();
      formData.append("video-file", videoFile);

      try {
        const response = await axios.post(`${MEDUSA_BACKEND_URL}/store/uploadVideoFile`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalVideoUrl = response.data.files["video-file"][0].url;
      } catch (error) {
        console.error("Error uploading video file:", error);
      }
    }
    // console.log("edited designImages ",designImages)
    const updatedFields: Record<string, any> = {};


    if (designPreference !== designPreferences.design_preference) {
      updatedFields.design_preference = designPreference;
    }

    // const differentDesignImages = designImages.filter(
    //   (img) => !designPreferences.design_images.includes(img)
    // );

    // if (differentDesignImages.length > 0) {
      updatedFields.design_images = designImages;
    // }

    // const differentMeasurementDressImages = measurementDressImages.filter(
    //   (img) => !designPreferences.measurement_dress_images.includes(img)
    // );

    // if (differentMeasurementDressImages.length > 0) {
      updatedFields.measurement_dress_images = measurementDressImages;
    // }

    updatedFields.design_preference_audio = finalAudioUrl;
    updatedFields.design_preference_video = finalVideoUrl;



    if (JSON.stringify(formValues) !== JSON.stringify(designPreferences.measurement_values)) {
      updatedFields.measurement_values = formValues;
    }

    const postData = {
      id: matchingItemId, // Pass the line item ID
      material_image_url: materialImageUrl, // Pass the material image URL
      ...updatedFields, // Spread the updated fields
    };

    console.log("variant ",variant)
   let liningStatus = false;
    if(variant?.title === "With Lining")
      {
        console.log("With Lining on edit")
        liningStatus = true;
      }

    // Send the POST request to the API
    axios.post(`${MEDUSA_BACKEND_URL}/store/customizeDesign`, postData)
      .then((response) => {
        // console.log("Design preferences updated successfully:", response.data);

        const responseData = {
          id: matchingItemId,
          material_image_url: materialImageUrl,
          design_preference: designPreference,
          design_images: designImages,
          measurement_values: formValues,
          measurement_dress_images: measurementDressImages,
          attach_lining: liningStatus,
          design_preference_audio: finalAudioUrl, // Locally stored audio URL
          design_preference_video: finalVideoUrl, // Locally stored video URL

        };
        onSubmit(responseData);
      })
      .catch((error) => {
        console.error("Error updating design preferences:", error);
      });
  };

  const handleEditPreferences = () => {
    const { valid: formIsValid, hasAtLeastOneDesignImage } = validateForm();

    if (!formIsValid) {
      setShowWarningModal(true); // Show the incomplete form dialog
      return;
    }

    if (!hasAtLeastOneDesignImage) {
      setShowDesignImageWarning(true); // Show the design image warning dialog
      return;
    }

    handleConfirmEdit();
    };

  
  // console.log("lineitem id ",lineItemId.id)
  // console.log("materialImageUrl ",materialImageUrl)
  // console.log("designImages ",designImages)
  // console.log("lineItemId.material_design_data ",lineItemId.material_design_data)

  const cartLineItem = cart?.items.find((item: LineItemWithDesign) => item.variant_id === variant?.id);

    // console.log("out cart ",cart)
    // console.log("out variant ",variant)

    // console.log("cartLineItem ",cartLineItem)


  // const isMaterialImagePresent = cartLineItem?.material_design_data?.[materialImageUrl];

  // console.log("isMaterialImagePresent ",isMaterialImagePresent)

  // const handleMeasurementOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setMeasurementOption(e.target.value);
  // };

  const handleMeasurementOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOption = e.target.value;
    
    // Check if we need to confirm deletion before switching
    if (newOption === "enter" && measurementDressImages.length > 0) {
      setDeleteType("dress");
      setShowDeleteConfirmation(true);
    } else if (newOption === "upload" && Object.keys(formValues).length > 0) {
      setDeleteType("measurements");
      setShowDeleteConfirmation(true);
    } else {
      // No confirmation needed, switch immediately
      setMeasurementOption(newOption);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteType === "dress") {
      // Clear measurement dress images
      setMeasurementDressImages([]);
      // Switch to "enter" mode since we deleted the dress images
      setMeasurementOption("enter");
    } else if (deleteType === "measurements") {
      // Clear form values (measurement table values)
      setFormValues({});
      // Switch to "upload" mode since we deleted the measurement values
      setMeasurementOption("upload");
    }
  
    // Close the delete confirmation dialog
    setShowDeleteConfirmation(false);
  };
  
// console.log("measurementOption ",measurementOption)
  const handleCancelDelete = () => {
    // Close confirmation dialog without deleting anything
    setShowDeleteConfirmation(false);
  };

  // Function to handle video preview click
  const handleVideoPreviewClick = () => {
    // console.log("clicked video")
    setIsFullScreenVideoOpen(true); // Open full-screen modal
  };

  // Function to close full-screen video modal
  const handleCloseFullScreenVideo = () => {
    setIsFullScreenVideoOpen(false); // Close full-screen modal
  };

  // console.log("customerProducts ",customerProducts)

  // console.log("selectedCustomerProduct ",selectedCustomerProduct)


  return (
    <>
      <Modal open={isOpen} onClose={onClose}>
        <Box
          sx={{
            width: "100vw", // Full viewport width
            height: "100vh", // Full viewport height
            padding: 4,
            backgroundColor: "white",
            margin: "0", // Remove margin for full-screen effect
            borderRadius: 0, // No border radius for full-screen look
            position: "relative",
            overflowY: "auto",
            boxShadow: "none", // Remove box shadow for full-screen effect
          }}
        >
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "#fc6c85",
            }}
          >
            <X />
          </IconButton>

          {materialImageUrl && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 4,
              }}
            >
              <img
                src={materialImageUrl}
                alt="Material Image"
                style={{
                  maxWidth: "200px",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </Box>
          )}

          <h2       className="font-caudex"
 style={{ color: "#fc6c85", marginBottom: "16px", fontSize: "1.5rem", textAlign: "center", fontWeight:"BOLD" }}>
            Design Preferences for {productTitle}
          </h2>

          <div style={{ marginBottom: 16, padding:"16px" }}>
            <label       className="font-caudex"
 style={{ color: "#fc6c85", fontWeight: "bold" }}>
              How would you like your material to be stitched and customized?
            </label>
            <input
                  className="font-caudex"
              type="text"
              value={designPreference}
              onChange={handleDesignPreferenceChange}
              placeholder="Enter how your material should be stitched and customized in words in your preferred language..."
              style={{ width: "100%", padding: "8px", marginTop: "8px", border: `1px solid #fc8b9c`, borderRadius: "4px" }}
            />
          </div>

  {/* Audio Section */}
  <div
        style={{
          marginBottom: "24px",
          paddingLeft: "16px", paddingBottom:"10px",
          // border: "1px solid #fc8b9c",
          // borderRadius: "8px",
          // backgroundColor: "#fce4ec",
        }}
      >
        <h4 className="text-large-regular font-caudex" style={{ color: "#fc6c85",fontWeight:"bold" ,marginBottom: "8px" }}>
          Record or Upload Your Audio Design Preference
          <IconButton
            aria-label="info"
            onClick={toggleAudioHelp}
            sx={{ color: "#fc8b9c", marginLeft: "8px" }}
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </IconButton>
        </h4>
        
        {/* Collapsible Help Information for Audio */}
        <Collapse in={showAudioHelp}>
          <p className="text-small-semi font-caudex" style={{ color: "#56242e", marginBottom: "16px" }}>
            Please record an audio message explaining how you would like your material to be stitched and customized. 
            You can also upload a pre-recorded audio file if you have one. We will use this audio to create your dress based on your verbal instructions.
          </p>
        </Collapse>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
    {/* Record/Stop Button */}
    {!isRecording ? (
      <Button
        onClick={startAudioRecording}
        // sx={{
        //   background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
        //   color: "white",
        //   ":hover": { backgroundColor: "#56242e" },
        //   padding: "8px 16px",
        //   fontSize: "0.9rem",
        //   borderRadius: "4px",
        //   flex: "1 1 auto",
        // }}
        sx={{
    ...buttonStyle,
    flex: "1 1 auto", // Add additional styles as needed
  }}
  className="font-caudex"
      >
        {audioFile || audioUrl ? "Re-record Audio" : "Start Audio Recording"}
      </Button>
    ) : (
      <Button
        onClick={stopAudioRecording}
        sx={{
          backgroundColor: "#d32f2f",
          color: "white",
          ":hover": { backgroundColor: "#b71c1c" },
          padding: "8px 16px",
          fontSize: "0.9rem",
          borderRadius: "4px",
          flex: "1 1 auto",
        }}
        className="font-caudex"
      >
        Stop Recording
      </Button>
    )}

    <p       className="font-caudex"
 style={{ marginBottom: 0, flexShrink: 0 }}>( Or )</p>

    {/* Upload Button */}
    <Button
      variant="contained"
      component="label"
      className="font-caudex"
      sx={{
    ...buttonStyle,
    flex: "1 1 auto", // Add additional styles as needed
  }}
    >
      Upload Audio
      <input
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        style={{
          display: "none", // Hide the actual input
        }}
        className="font-caudex"
      />
    </Button>
  </div>
        {audioUrl && (
          <div>
            <p       className="font-caudex"
 style={{ color: "#56242e", fontSize: "0.9rem", marginBottom: "8px" }}>
              Your audio has been recorded successfully. You can listen to it below:
            </p>
            <div style={{ position: "relative", marginTop: "16px" }}>

            <audio controls src={audioUrl} style={{ width: "50%" }} />
             {/* X icon to remove audio */}
             <IconButton
  onClick={() => deleteMediaFile(audioUrl, "audio")}
  size="small"  // Reduces the button size
  className="font-caudex"
  sx={{
    position: "absolute",
    top: "-5px",
    left: 0,
    backgroundColor: "black",
    color: "#d32f2f",
    padding: "2px",  // Adjusts padding to make it smaller
    ":hover": { backgroundColor: "#f8d7da" },
  }}
>
  <X />
</IconButton>

    </div>
          </div>
        )}
      </div>

      {/* Video Section */}
      <div
        style={{
          marginBottom: "24px",
          paddingLeft: "16px", paddingBottom:"10px",
          // border: "1px solid #fc8b9c",
          // borderRadius: "8px",
          // backgroundColor: "#fce4ec",
        }}
      >
        <h4 className="font-caudex text-large-regular" style={{ color: "#fc6c85",fontWeight:"bold" ,marginBottom: "8px" }}>
          Record or Upload Your Video Design Preference
          <IconButton
            aria-label="info"
            onClick={toggleVideoHelp}
            sx={{ color: "#fc8b9c", marginLeft: "8px" }}
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </IconButton>
        </h4>

        {/* Collapsible Help Information for Video */}
        <Collapse in={showVideoHelp}>
          <p className="font-caudex text-small-semi" style={{ color: "#56242e", marginBottom: "16px" }}>
            Record a video showing how you would like your material to be stitched and customized. You can also upload a pre-recorded video. 
            We will follow your visual instructions to stitch your dress exactly as you demonstrate.
          </p>
        </Collapse>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
    {/* Record/Stop Button */}
    {!isRecordingVideo ? (
      <Button
        onClick={startVideoRecording}
        // sx={{
        //   background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
        //   color: "white",
        //   ":hover": { backgroundColor: "#56242e" },
        //   padding: "8px 16px",
        //   fontSize: "0.9rem",
        //   borderRadius: "4px",
        //   flex: "1 1 auto",
        // }}
        sx={{
    ...buttonStyle,
    flex: "1 1 auto", // Add additional styles as needed
  }}
  className="font-caudex"
      >
        {videoFile || videoUrl ? "Re-record Video" : "Start Video Recording"}
      </Button>
    ) : (
      <Button
        onClick={stopVideoRecording}
        sx={{
          backgroundColor: "#d32f2f",
          color: "white",
          ":hover": { backgroundColor: "#b71c1c" },
          padding: "8px 16px",
          fontSize: "0.9rem",
          borderRadius: "4px",
          flex: "1 1 auto",
        }}
        className="font-caudex"
      >
        Stop Video Recording
      </Button>
    )}

    <p       className="font-caudex"
 style={{ marginBottom: 0, flexShrink: 0 }}>( Or )</p>

    {/* Upload Button */}
    <Button
      variant="contained"
      component="label"
      sx={{
    ...buttonStyle,
    flex: "1 1 auto", // Add additional styles as needed
  }}
  className="font-caudex"
    >
      Upload Video
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{
          display: "none", // Hide the actual input
        }}
        className="font-caudex"
      />
    </Button>
  </div>

        {videoUrl && (
    <div
    style={{
      position: "relative",
      display: "inline-block",
      marginTop: "16px",
    
    }}
  >
    {/* Video Preview */}
    <video
      controls
      src={videoUrl}
      style={{
        width: "150px", 
        height: "150px",
        borderRadius: "8px", // Rounded corners for the video
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
      }}
    />

    {/* X icon to remove video */}
    <IconButton
      onClick={() => deleteMediaFile(videoUrl, "video")}
      sx={{
        position: "absolute",
        top: "10px",
        left: "10px",
        backgroundColor: "black",
        color: "#d32f2f",
        ":hover": { backgroundColor: "#f8d7da" },
      }}
    >
      <X />
    </IconButton>

    {/* Full Screen Button */}
    <button
      onClick={handleVideoPreviewClick}
      style={{
        position: "absolute", // Position the button in relation to the container
        top: "15px", // Position from the top
        right: "10px", // Position from the right
        backgroundColor: "#000", // Button background color
        color: "#ffffff", // Button text color
        padding: "5px 10px", // Padding inside the button
        border: "none", // Remove default border
        borderRadius: "4px", // Rounded corners
        fontSize: "12px", // Slightly smaller text for the button
        cursor: "pointer", // Pointer cursor on hover
        transition: "background-color 0.3s ease", // Smooth transition on hover
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#000")} // Darker color on hover
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#000")} // Restore original color when not hovering
    >
      <FontAwesomeIcon icon={faExpand} /> {/* Full Screen Icon */}
    </button>
  </div>
)}
      </div>
      
         {/* Full-Screen Video Modal */}
      <Modal open={isFullScreenVideoOpen} onClose={handleCloseFullScreenVideo}>
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            backgroundColor: "black",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Full-Screen Video */}
          <video
            ref={videoElementRef}
            controls
            src={videoUrl || ""}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            autoPlay
          />

          {/* Close Button */}
          <IconButton
            aria-label="close"
            onClick={handleCloseFullScreenVideo}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "#d32f2f",
              color: "white",
            }}
          >
            <X />
          </IconButton>
        </Box>
      </Modal>

        <div>
          {/* <h4>Recording Video</h4> */}
          {isRecordingVideo ? (
                <div
                  style={{
                    width: "100vw",
                    height: "100vh",
                    position: "fixed", // Make it fixed to prevent scrolling
                    top: 0,
                    left: 0,
                    backgroundColor: "black",
                    zIndex: 9999,
                    display: "flex", // Flex container for centering
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {/* Full-Screen Video Recording */}
                  <video
                    ref={videoElementRef}
                    autoPlay
                    muted
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover" }} // Contain the video within the viewport
                  />
                  <IconButton
                    onClick={stopVideoRecording}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      backgroundColor: "#d32f2f",
                      color: "white",
                    }}
                  >
                    <X />
                  </IconButton>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Small Video Preview */}
                  {videoFile ? (
                    <div className="hidden" style={{background:"red"}}>
                    <video
                      controls
                      src={URL.createObjectURL(videoFile)}
                      style={{ width: "500px", height: "100px", objectFit: "cover" }}
                    />
                    </div>
                  ) : (
                    // <div className="hidden" style={{background:"blue"}}>

                    <video
                      ref={videoElementRef}
                      autoPlay
                      muted
                      style={{ width: "150px", height: "100px", objectFit: "cover", display: stream ? "block" : "none" }}
                    />
                    // </div>
                  )}
                </div>
              )}
          </div>

          <div style={{ marginBottom: 16, paddingLeft: "16px", paddingBottom:"10px", }}>
            <label       className="font-caudex"
 style={{ color: "#56242e", fontWeight: "bold" }}>
              Upload Design Photos (e.g., how the material will be stitched)
            </label>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginTop:2 }}>

            <Button
        variant="contained"
        onClick={() => {
          setIsCapturing(true);
          startCamera();
        }}
        disabled={uploadingImages}
        sx={{background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", // Gradient background
    color: "white",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.4)", // Add shadow for enabled buttons
    border: "none",
    ":hover": { backgroundColor: "#56242e" },}}
    className="font-caudex"
      >
        Capture design image Now
      </Button>

      {!isCapturing && (
  <p style={{ marginBottom: 0, flexShrink: 0 }}>( Or )</p>
      )}

      {!isCapturing && (

<Button
  variant="contained"
  component="label"
  disabled={uploadingImages}
  className="font-caudex"
  sx={{ fontSize:"0.9rem", textAlign:"center", background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",textTransform:"capitalize", marginLeft: 2, color: "white", ":hover": { backgroundColor: "#56242e" }, }}
>
  {uploadingImages ? "Uploading..." : "Upload Design Photos"}
  <input type="file" hidden multiple onChange={(e) => handleImageUpload(e, "design")} />
</Button>
)}
</Box>

      {isCapturing && (
        <div style={{ position: "relative", marginTop: "16px" }}>
          <video ref={videoRef} width="320" height="240" style={{ border: "1px solid #ddd", borderRadius: "8px" }} />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: "none" }}></canvas>
          <Button
            onClick={captureImage}
            className="font-caudex"
            sx={{ marginTop: "16px", background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)", color: "white", ":hover": { backgroundColor: "#56242e" } }}
          >
            Capture Image
          </Button>
          <Button
            onClick={() => {
              setIsCapturing(false);
              stopCamera();
            }}
            className="font-caudex"
            sx={{ marginTop: "16px", marginLeft: "8px", backgroundColor: "#d32f2f", color: "white", ":hover": { backgroundColor: "#b71c1c" } }}
          >
            Stop Capturing
          </Button>
        </div>
      )}

{isCapturing && capturedImages.length > 0 &&(
<div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
  <Button
    onClick={uploadCapturedDesignImages}
    disabled={capturedImages.length === 0 }
    sx={{
      background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
      color: "white",
      ":hover": { backgroundColor: "#fc8b9c" },
      padding: "8px 16px",
      borderRadius: "4px",
    }}
    className="font-caudex"
  >
    Upload Captured Design Images
  </Button>
</div>
)}
      {/* Display Captured Images */}
      {isCapturing &&(
      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {capturedImages.map((image, index) => (
          <div key={index} style={{ position: "relative", display: "inline-block" }}>
            <img
              src={image}
              alt={`Captured Image ${index + 1}`}
              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
            />
            <IconButton
              sx={{ position: "absolute", top: 0, right: 0, backgroundColor: "white", padding: "2px", borderRadius: "50%" }}
              size="small"
              onClick={() => handleCapturedRemoveImage(index,"design")}
            >
              <X />
            </IconButton>
          </div>
        ))}
      </div>
      )}
          </div>

          <div style={{ marginBottom: 16, display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {designImages.map((image, index) => (
              <div key={index} style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={image}
                  alt={`Design Image ${index + 1}`}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "white",
                    padding: "2px",
                    borderRadius: "50%",
                  }}
                  size="small"
                  onClick={() => handleRemoveImage(index, "design")}
                >
                  <X />
                </IconButton>
              </div>
            ))}
          </div>

          <h3 className="font-caudex text-large-regular" style={{ color: "#fc6c85", marginBottom: "16px", paddingLeft: "16px", fontWeight:"bold" }}>Measurement Options</h3>
 {/* Note Section */}
 <div
    style={{
      backgroundColor: "#fdecea",
      border: "1px solid #f5c6cb",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "16px",
      fontSize: "0.9rem",
    }}
  >
    <p
      className="font-caudex"
      style={{
        color: "#56242e",
        fontWeight: "bold",
        marginBottom: "8px",
      }}
    >
      Note:
    </p>
    <p
      className="font-caudex"
      style={{
        color: "#6e323b",
        marginBottom: "0",
        lineHeight: "1.5",
      }}
    >
      It is recommended to send a reference measurement dress for tailoring. If
      you choose to enter measurements in the table, please ensure that they
      are accurate to avoid any fitting issues.
    </p>
  </div>
  
<RadioGroup
  value={measurementOption}
  onChange={handleMeasurementOptionChange}
  style={{paddingLeft: "16px"}}
>
  <FormControlLabel
    value="upload"
    control={<Radio />}
    className="font-caudex"
    label="I want to send a reference measurement dress for measurement"
  />
  <FormControlLabel
    value="enter"
    control={<Radio />}
    className="font-caudex"
    label="I want to enter my measurement sizes here"
  />
</RadioGroup>

{measurementOption === "upload" ? (
<div style={{padding: "16px"}}>
          <div style={{ marginBottom: 16, }}>
            <label       className="font-caudex"
 style={{ color: "#56242e", fontWeight: "bold" }}>
              Upload Measurement Dress Images (e.g., images used for tailoring reference)
            </label>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginTop:2 }}>

            <Button
        variant="contained"
        onClick={() => {
          setIsCapturingDress(true);
          startDressCamera();
        }}
        disabled={uploadingImages}
        sx={{background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", // Gradient background
    color: "white",
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.4)", // Add shadow for enabled buttons
    border: "none",
    ":hover": { backgroundColor: "#56242e" },}}
    className="font-caudex"
      >
        Capture measurement dress image Now
      </Button>

      {!isCapturingDress && (
 <p style={{ marginBottom: 0, flexShrink: 0 }}>( Or )</p>
      )}

      {!isCapturingDress && (

<Button
  variant="contained"
  component="label"
  disabled={uploadingDressImages}
  sx={{ fontSize:"0.9rem", textAlign:"center", background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)", marginLeft: 2, textTransform:"capitalize", color: "white", ":hover": { backgroundColor: "#56242e" }, }}
>
  {uploadingDressImages ? "Uploading..." : "Upload Measurement Dress Images"}
  <input type="file" hidden multiple onChange={(e) => handleImageUpload(e, "dress")} />
</Button>
)}
</Box>

      {isCapturingDress && (
        <div style={{ position: "relative", marginTop: "16px" }}>
          <video ref={videoDressRef} width="320" height="240" style={{ border: "1px solid #ddd", borderRadius: "8px" }} />
          <canvas ref={canvasDressRef} width="320" height="240" style={{ display: "none" }}></canvas>
          <Button
                className="font-caudex"
            onClick={captureDressImage}
            sx={{ marginTop: "16px", backgroundColor: "#000", color: "white", ":hover": { backgroundColor: "#56242e" } }}
          >
            Capture Measurement Dress Image
          </Button>
          <Button
                className="font-caudex"
            onClick={() => {
              setIsCapturingDress(false);
              stopDressCamera();
            }}
            sx={{ marginTop: "16px", marginLeft: "8px", backgroundColor: "#d32f2f", color: "white", ":hover": { backgroundColor: "#b71c1c" } }}
          >
            Stop Measurement Dress Capturing
          </Button>
        </div>
      )}

{isCapturingDress && capturedDressImages.length > 0 &&(
<div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
  <Button
    onClick={uploadCapturedDressImages}
    disabled={capturedDressImages.length === 0 }
    sx={{
      background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
      color: "white",
      ":hover": { backgroundColor: "#fc8b9c" },
      padding: "8px 16px",
      borderRadius: "4px",
    }}
    className="font-caudex"
  >
    Upload Captured Measurement Dress Images
  </Button>
</div>
)}

{/* Display Captured Images */}
{isCapturingDress &&(
      <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {capturedDressImages.map((image, index) => (
          <div key={index} style={{ position: "relative", display: "inline-block" }}>
            <img
              src={image}
              alt={`Captured Image ${index + 1}`}
              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
            />
            <IconButton
              sx={{ position: "absolute", top: 0, right: 0, backgroundColor: "white", padding: "2px", borderRadius: "50%" }}
              size="small"
              onClick={() => handleCapturedRemoveImage(index,"dress")}
            >
              <X />
            </IconButton>
          </div>
        ))}
      </div>
      )}
          </div>

          <div style={{ marginBottom: 16, display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {measurementDressImages.map((image, index) => (
              <div key={index} style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={image}
                  alt={`Dress Image ${index + 1}`}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "white",
                    padding: "2px",
                    borderRadius: "50%",
                  }}
                  size="small"
                  onClick={() => handleRemoveImage(index, "dress")}
                >
                  <X />
                </IconButton>
              </div>
            ))}
          </div>
          </div>
) : (
  <div style={{padding: "16px" }}>
          <h3 className="font-caudex text-large-regular" style={{ color: "#fc8b9c", marginBottom: "16px", fontWeight:"bold" }}>Measurement Table</h3>
          <p className="font-caudex text-base-regular" style={{ color: "#56242e", marginBottom: "16px" }}>
            If you haven’t uploaded any measurement dress images, please enter the corresponding measurement values below.
          </p>

  {/* Customer-Product Dropdown */}
  {customerProducts.length > 0 && (

  <div style={{ marginBottom: "16px" }}>
                <label       className="font-caudex"
 style={{ color: "#56242e", fontWeight: "bold", marginBottom: "8px", display: "block" }}>Select Customer with Measurement Data</label>
                <Select
                  value={selectedCustomerProduct}
                  onChange={handleCustomerProductSelect}
                  displayEmpty
                  style={{ width: "100%", marginBottom: "16px" }}
                >
                  <MenuItem value="" disabled       className="font-caudex"
                  >Select Customer and Product</MenuItem>
                  {customerProducts.map(({ customerName, productName }, index) => (
                    <MenuItem key={index} value={`${customerName}-${productName}`}>
                      {`${customerName} - ${productName}`}
                    </MenuItem>
                  ))}
                </Select>
              </div>
  )}
          {measurements.map(({ attributeName, imageUrl }: any) => (
            <div key={attributeName} style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
              <img
                src={imageUrl}
                alt={`${attributeName} image`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginRight: "16px", // Adds space between the image and the input field
                }}
              />
              <div style={{ flex: 1 }}>
                <label       className="font-caudex"
 style={{ color: "#56242e", fontWeight: "bold" }}>{attributeName}</label>
                <input
                  type="number"
                  name={attributeName}
                  value={formValues[attributeName] || ""}
                  onChange={handleInputChange}
                  placeholder={`Enter ${attributeName} measurement`}
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "8px",
                    border: `1px solid #fc8b9c`,
                    borderRadius: "4px",
                  }}
                  min="1"
                />
              </div>
            </div>
          ))}
 </div>
          )}

<div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>

{matchingItemId ? (
            <Button
            onClick={handleEditPreferences} // Handle validation for Edit Design Preferences
              variant="contained"
              sx={{
                background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
                color: "white",
                ":hover": { backgroundColor: "#56242e" },
                width: {
          xs: "100%", // Mobile devices (extra-small screens)
          sm: "75%", // Small devices (tablets)
          md: "50%", // Medium devices (laptops)
          lg: "50%", // Large devices (desktops)
        },
                padding: "12px",
                marginTop: "16px",
                // borderRadius: "6px",
              }}
              disabled={uploadingImages || uploadingDressImages}
              className="font-caudex"
            >
              Edit Design Preferences
            </Button>
          ):(
<Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)",
              color: "white",
              ":hover": { backgroundColor: "#56242e" },
              width: {
          xs: "100%", // Mobile devices (extra-small screens)
          sm: "75%", // Small devices (tablets)
          md: "50%", // Medium devices (laptops)
          lg: "50%", // Large devices (desktops)
        },
              padding: "12px",
              marginTop: "16px",
              // borderRadius: "6px",
            }}
            disabled={uploadingImages || uploadingDressImages}
            className="font-caudex"
>
            Submit Design Preferences
          </Button>
          )}
          
          </div>
        </Box>
      </Modal>

      <Modal open={showWarningModal} onClose={() => setShowWarningModal(false)}>
  <Box
    sx={{
      width: { xs: "90%", sm: "80%", md: "60%", lg: "40%" }, // Adjust width based on screen size
      backgroundColor: "white",
      padding: 4,
      margin: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      position: "relative",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow for better visibility
      borderRadius: 8, // Rounds the corners of the modal
    }}
  >
    <h2       className="font-caudex"
 style={{ color: "#d32f2f", fontSize: "1.5rem", marginBottom: "16px", textAlign: "center" }}>
      Incomplete Submission
    </h2>
    <p       className="font-caudex"
 style={{ color: "#424242", fontSize: "1rem", marginBottom: "24px", textAlign: "center" }}>
      To proceed, please either upload at least one measurement dress image or ensure all fields in the measurement table are filled with values greater than 0.
    </p>
    <Button
      onClick={() => setShowWarningModal(false)}
      variant="contained"
      sx={{
        backgroundColor: "#d32f2f",
        color: "white",
        display: "block",
        width: "100%",
        padding: "12px",
        fontSize: "1rem",
        borderRadius: "8px",
        ":hover": { backgroundColor: "#b71c1c" },
      }}
    >
      Okay, Got it!
    </Button>
  </Box>
</Modal>


<Modal open={showDesignImageWarning} onClose={() => setShowDesignImageWarning(false)}>
  <Box
    sx={{
      width: { xs: "90%", sm: "80%", md: "60%", lg: "40%" }, // Responsive width
      backgroundColor: "white",
      padding: 4,
      margin: "auto",
      top: "50%",
      transform: "translateY(-50%)",
      position: "relative",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Adds a subtle shadow for better visibility
      borderRadius: 8, // Rounded corners for a modern look
    }}
  >
    <h2       className="font-caudex"
style={{ color: "#d32f2f", fontSize: "1.5rem", marginBottom: "16px", textAlign: "center" }}>
      Design Image Required
    </h2>
    <p       className="font-caudex"
style={{ color: "#424242", fontSize: "1rem", marginBottom: "24px", textAlign: "center" }}>
      To submit your preferences, please upload at least one design image that shows how your material should be stitched or customized.
    </p>
    <Button
      onClick={() => setShowDesignImageWarning(false)}
      variant="contained"
      sx={{
        backgroundColor: "#d32f2f",
        color: "white",
        display: "block",
        width: "100%",
        padding: "12px",
        fontSize: "1rem",
        borderRadius: "8px",
        ":hover": { backgroundColor: "#b71c1c" },
      }}
      className="font-caudex"
    >
      Got it!
    </Button>
  </Box>
</Modal>


       {/* Delete Confirmation Dialog */}
      <Modal open={showDeleteConfirmation} onClose={handleCancelDelete}>
        <Box
          sx={{
            width: { xs: "90%", sm: "80%", md: "60%", lg: "40%" },
            backgroundColor: "white",
            p: 4,
            margin: "auto",
            top: "50%",
            transform: "translateY(-50%)",
            position: "relative",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: 8,
          }}
        >
          <h2       className="font-caudex"
style={{ color: "#d32f2f", textAlign: "center", fontWeight: "bold" }}>Delete Confirmation</h2>
          <p       className="font-caudex"
style={{ color: "#424242", textAlign: "center", marginBottom: "24px" }}>
            {deleteType === "dress"
              ? "Do you want to delete the measurement dress images?"
              : "Do you want to delete the measurement values?"}
          </p>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button
                  className="font-caudex"
              onClick={handleCancelDelete}
              sx={{ background: "linear-gradient(to right, #fc6c85, #fc8b9c, #fc9dab, #fc8b9c, #fc6c85)", boxShadow: "0px 2px 4px rgba(0, 0,0,0.4)", color: "white", ":hover": { backgroundColor: "#56242e" } }}
            >
              Cancel
            </Button>
            <Button
                  className="font-caudex"
              onClick={handleConfirmDelete}
              sx={{ backgroundColor: "#d32f2f", color: "white", ":hover": { backgroundColor: "#b71c1c" } }}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
</>
  );
};

export default DesignPreferencesModal;
