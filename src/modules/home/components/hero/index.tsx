"use client";
import React, { useState, useEffect, useRef, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import './Hero.css';
import ProductModal from "./ProductList";

const Hero = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [screenHeight, setScreenHeight] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(true); // State to control modal visibility
  const router = useRouter();

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        const videoDuration = videoRef.current?.duration;
        console.log(`Video duration: ${videoDuration} seconds`);

        // Set a timeout to scroll to the DiscountCarousel component
        if (videoDuration) {
          setTimeout(() => {
            scrollToDiscountCarousel();
          }, videoDuration * 1000);
        }
      };

      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener(
            "loadedmetadata",
            handleLoadedMetadata
          );
        }
      };
    }
  }, []);

  const navigateToStore = () => {
    console.log("clicked navigate to store");
    router.push("/explore/products/gown");
  };

  const scrollToNextSection = () => {
    const nextSection = document.getElementById("next-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToDiscountCarousel = () => {
    const discountCarousel = document.getElementById("discount-carousel");
    if (discountCarousel) {
      discountCarousel.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="hero-container">
      {/* Display the modal when isModalOpen is true */}
      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} // Close modal handler
        />
      )}
      
      <video
        ref={videoRef}
        className="fullscreen-video"
        src="/bg_video21.mp4"
        autoPlay
        loop
        muted
        playsInline
      ></video>
      <div className="video-overlay"></div>
      <div className="banner-text">
        <h1 className="font-sofia">Tailor Your Dream Gown</h1>
        <p className="font-sofia">
          Upload your gown design, provide your measurements, and let us craft
          it to perfection. From pickup to doorstep delivery, we handle every
          step.
        </p>
        <button className="scroll-button" onClick={navigateToStore}>
          Start Your Custom Design
        </button>
      </div>
    </div>
  );
};

export default Hero;
