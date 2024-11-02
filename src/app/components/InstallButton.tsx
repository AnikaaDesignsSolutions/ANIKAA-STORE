"use client";

import React, { useState, useEffect } from "react";

// Define the type for the `beforeinstallprompt` event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallButton: React.FC = () => {
  // Use `BeforeInstallPromptEvent | null` as the state type
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event); // Save the event so it can be triggered later
    };

    // Add event listener with type assertion for `beforeinstallprompt`
    window.addEventListener("beforeinstallprompt" as string, handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener("beforeinstallprompt" as string, handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the install prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        setDeferredPrompt(null); // Reset the deferred prompt
      });
    }
  };

  return (
    deferredPrompt && (
      <button onClick={handleInstallClick} className="install-button">
        Install App
      </button>
    )
  );
};

export default InstallButton;
