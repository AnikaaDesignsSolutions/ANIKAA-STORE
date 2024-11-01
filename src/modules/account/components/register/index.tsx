"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useFormState } from "react-dom";
import axios from "axios";
import Medusa from "@medusajs/medusa-js";

import Input from "@modules/common/components/input";
import { LOGIN_VIEW } from "@modules/account/templates/login-template";
import { signUp } from "@modules/account/actions";
import ErrorMessage from "@modules/checkout/components/error-message";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import {
  emailPattern,
  phoneNumberPattern,
  passwordPattern,
  namePattern,
} from "@lib/util/regex";
import { MEDUSA_BACKEND_URL } from "@lib/config";

// Initialize Medusa instance
const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 });

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void;
};

// Define the types for form fields and errors
type FormFields = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
};

const Register = ({ setCurrentView }: Props) => {
  // State to manage form inputs
  const [formData, setFormData] = useState<FormFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  // State to manage error messages for each input
  const [errors, setErrors] = useState<FormFields>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [message, formAction] = useFormState(signUp, null);
  const [accountExistsError, setAccountExistsError] = useState<string | null>(
    null
  ); // State for account exists error

  // Update form data state and validate as user types
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Type assertion to ensure name is a valid key of FormFields
    if (name in formData) {
      setFormData({
        ...formData,
        [name]: value,
      });

      let validationErrors = { ...errors };

      // Clear previous error if the user starts correcting the field
      validationErrors[name as keyof FormFields] = "";

      // Clear account exists error when phone or email input is edited
      if (name === "phone" || name === "email") {
        setAccountExistsError(null);
      }

      // Perform real-time validation
      if (name === "first_name" && !namePattern.test(value)) {
        validationErrors.first_name =
          "First name is invalid. Please enter a valid name.";
      } else if (name === "last_name" && value && !namePattern.test(value)) {
        validationErrors.last_name =
          "Last name is invalid. Please enter a valid name.";
      } else if (name === "email" && value && !emailPattern.test(value)) {
        validationErrors.email =
          "Email is invalid. Please enter a valid email address.";
      } else if (name === "phone" && value && !phoneNumberPattern.test(value)) {
        validationErrors.phone =
          "Phone number is invalid. Please enter a valid phone number.";
      } else if (name === "password" && !passwordPattern.test(value)) {
        validationErrors.password =
          "Password does not meet requirements. Please enter a valid password.";
      }

      setErrors(validationErrors);
    }
  };

  // Form validation on submission
  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let hasErrors = false;
    let validationErrors = { ...errors };

    // Validate first name
    if (!namePattern.test(formData.first_name)) {
      validationErrors.first_name =
        "First name is invalid. Please enter a valid name.";
      hasErrors = true;
    }

    // Validate last name if provided
    if (formData.last_name && !namePattern.test(formData.last_name)) {
      validationErrors.last_name =
        "Last name is invalid. Please enter a valid name.";
      hasErrors = true;
    }

    // Validate email or phone
    if (!formData.email && !formData.phone) {
      validationErrors.email = "Please enter either an email or a phone number.";
      validationErrors.phone = "Please enter either an email or a phone number.";
      hasErrors = true;
    } else {
      if (formData.email && !emailPattern.test(formData.email)) {
        validationErrors.email =
          "Email is invalid. Please enter a valid email address.";
        hasErrors = true;
      }

      if (formData.phone && !phoneNumberPattern.test(formData.phone)) {
        validationErrors.phone =
          "Phone number is invalid. Please enter a valid phone number.";
        hasErrors = true;
      }
    }

    // Validate password
    if (!passwordPattern.test(formData.password)) {
      validationErrors.password =
        "Password does not meet requirements. Please enter a valid password.";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(validationErrors);
      return;
    }

    // Clear previous error messages
    setErrors({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
    });
    // Check if the phone number already exists using Axios
    try {
      const response = await axios.get(
        `${MEDUSA_BACKEND_URL}/store/getEmailforPassword`,
        {
          params: {
            phoneNo: formData.phone,
          },
        }
      );
      const data = response.data;

      if (data.customer) {
        setAccountExistsError(
          `An account with phone number ${formData.phone} already exists.`
        );
        return;
      }
    } catch (error) {
      console.error("Error checking phone number:", error);
      return;
    }

    // If phone is provided but no email, generate placeholder email
    let dataToSubmit = { ...formData };
    if (!formData.email && formData.phone) {
      dataToSubmit.email = `${formData.phone}@unidentified.com`;
    }

    // Convert dataToSubmit to FormData instance
    const formDataToSubmit = new FormData();
    Object.entries(dataToSubmit).forEach(([key, value]) => {
      formDataToSubmit.append(key, value);
    });

        // Check if the email already exists using Medusa
        try {
          console.log("response  email  ",dataToSubmit.email)
    
          const response = await medusa.auth.exists(dataToSubmit.email);
          console.log("response  email  ",response)
    
          if (response.exists) {
            console.log("response exists email  ",response)
            setAccountExistsError(
              `An account with email ${dataToSubmit.email} already exists.`
            );
            return;
          }
        } catch (error) {
          console.error("Error checking email:", error);
          return;
        }
    // Submit the form
    formAction(formDataToSubmit);
  };

  return (
    <div className="max-w-sm flex flex-col items-center" data-testid="register-page">
      <h1 className="text-large-semi uppercase mb-6">
        Become an Anikaa Store Member
      </h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-4">
        Create your Anikaa Store Member profile, and get access to an enhanced
        shopping experience.
      </p>
      {accountExistsError && (
        <p className="text-red-600 text-small-regular mb-6" data-testid="account-exists-error">
          {accountExistsError}
        </p> // Display error if account exists
      )}
      <form className="w-full flex flex-col" onSubmit={handleFormSubmit}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="First name"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            autoComplete="given-name"
            required
            data-testid="first-name-input"
          />
          {errors.first_name && (
            <ErrorMessage
              error={errors.first_name}
              data-testid="first-name-error"
            />
          )}
          <Input
            label="Last name"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            autoComplete="family-name"
            data-testid="last-name-input"
          />
          {errors.last_name && (
            <ErrorMessage
              error={errors.last_name}
              data-testid="last-name-error"
            />
          )}
          <Input
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            type="email"
            autoComplete="email"
            data-testid="email-input"
          />
          {errors.email && (
            <ErrorMessage error={errors.email} data-testid="email-error" />
          )}
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
          {errors.phone && (
            <ErrorMessage error={errors.phone} data-testid="phone-error" />
          )}
          <Input
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
            type="password"
            autoComplete="new-password"
            data-testid="password-input"
          />
          {errors.password && (
            <ErrorMessage error={errors.password} data-testid="password-error" />
          )}
        </div>
        <SubmitButton className="w-full mt-6" data-testid="register-button">
          Join
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Already a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="underline"
        >
          Sign in
        </button>
        .
      </span>
    </div>
  );
};

export default Register;
