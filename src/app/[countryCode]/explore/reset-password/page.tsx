"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Import useSearchParams for query params and useRouter for navigation
import axios from "axios";
import Input from "@modules/common/components/input";
import ErrorMessage from "@modules/checkout/components/error-message";
import { SubmitButton } from "@modules/checkout/components/submit-button";

type Props = {
  setCurrentView: (view: any) => void; // Replace 'any' with appropriate view type if necessary
};

const ResetPassword = ({ setCurrentView }: Props) => {
  const searchParams = useSearchParams(); // Retrieve query params
  const router = useRouter(); // Initialize useRouter for navigation
  const emailOrPhoneFromQuery = searchParams.get("emailOrPhone"); // Get email or phone from URL params

  // State to manage form data
  const [formData, setFormData] = useState({
    emailOrPhone: emailOrPhoneFromQuery || "", // Pre-fill the email or phone number from the URL
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // To show loading state during API calls

  // Function to check if the value is a phone number
  const isPhoneNumber = (value: string) => {
    const phonePattern = /^\+?[0-9\s\-()]+$/;
    return phonePattern.test(value);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      let email = formData.emailOrPhone;

      // If the emailOrPhone is a phone number, fetch the associated email
      if (isPhoneNumber(email)) {
        const response = await axios.get("http://localhost:9000/store/getEmailforPassword", {
          params: {
            phoneNo: email, // Send phone number to get the associated email
          },
        });

        const data = response.data;
        if (data.customer && data.customer.email) {
          email = data.customer.email; // Update email to the one fetched from the phone number
        } else {
          setError("No account found with this phone number.");
          setLoading(false);
          return;
        }
      }

      console.log("email of phone ",email)
      // POST request to update the password using the email obtained
      const response = await axios.post("http://localhost:9000/store/getEmailforPassword", {
        email: email, // Email retrieved from the phone number or already entered email
        password_body: formData.password, // Password being updated
      });

      if (response.status === 200) {
        // If the API responds with success, navigate to the account page
        router.push("/explore/account");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("An error occurred while resetting the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center"> {/* Reduced height */}
      <div className="max-w-sm w-full flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-large-semi uppercase mb-6">Reset Password</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Reset your password for a better experience.
        </p>
        <form className="w-full" onSubmit={handleFormSubmit}>
          <div className="flex flex-col w-full gap-y-2">
            {/* Pre-filled email/phone input, disabled so it can't be changed */}
            <Input
              label="Email or Phone"
              name="emailOrPhone"
              type="text"
              title="Email or phone number cannot be changed."
              value={formData.emailOrPhone}
              onChange={handleInputChange}
              required
              data-testid="email-or-phone-input"
              disabled // Disable the input to prevent editing
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              required
              data-testid="password-input"
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              data-testid="confirm-password-input"
            />
          </div>
          {error && <ErrorMessage error={error} data-testid="error-message" />}
          <SubmitButton
            data-testid="reset-password-button"
            className="w-full mt-6"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
