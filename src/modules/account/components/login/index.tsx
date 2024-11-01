import { useFormState } from "react-dom";
import { LOGIN_VIEW } from "@modules/account/templates/login-template";
import Input from "@modules/common/components/input";
import { logCustomerIn } from "@modules/account/actions";
import ErrorMessage from "@modules/checkout/components/error-message";
import { SubmitButton } from "@modules/checkout/components/submit-button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEDUSA_BACKEND_URL } from "@lib/config";
import Medusa from "@medusajs/medusa-js";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // Import toast functions and container
import "react-toastify/dist/ReactToastify.css"; // Import toast styles

const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 });

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void;
};

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(logCustomerIn, null);
  const router = useRouter();

  // State to manage form inputs
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  // Update form data state
  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Form submission handling
  const handleFormSubmit = async (e: any) => {
    e.preventDefault();

    // Define dataToSubmit to allow both email and password
    let dataToSubmit: { password: string; email?: string } = {
      password: formData.password,
    };

    // Check if the input is an email or phone number
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(formData.emailOrPhone)) {
      // If the input matches an email pattern
      dataToSubmit = {
        ...dataToSubmit,
        email: formData.emailOrPhone,
      };
    } else if (/^\+?[0-9\s\-()]+$/.test(formData.emailOrPhone)) {
      // If the input contains valid phone characters, treat it as a phone number
      console.log(`Phone number ${formData.emailOrPhone} is entered in the input field`);

      // Make the API call to check if the phone number exists
      try {
        const response = await axios.get(
          `http://localhost:9000/store/getEmailforPassword`,
          {
            params: {
              phoneNo: formData.emailOrPhone,
            },
          }
        );
        const data = response.data;

        // Set email using phone number or use the actual email from API response if available
        dataToSubmit = {
          ...dataToSubmit,
          email: data.customer?.email || `${formData.emailOrPhone}@unidentified.com`,
        };

        console.log(data.customer.email); // Display response data on the console
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error retrieving account information.");
        return;
      }
    } else {
      alert("Please enter a valid email address or phone number.");
      return;
    }

    // Convert dataToSubmit to FormData instance
    const formDataToSubmit = new FormData();
    Object.entries(dataToSubmit).forEach(([key, value]) => {
      formDataToSubmit.append(key, value);
    });

    // Submit the form
    formAction(formDataToSubmit);
  };

  const handleForgotPassword = async () => {
    if (!formData.emailOrPhone) {
      alert("Please enter your email or phone number first.");
      return;
    }
  
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emailOrPhone = formData.emailOrPhone;
  
    // Check if the input is a phone number or an email
    if (!emailPattern.test(emailOrPhone)) {
      // It's a phone number, so let's check if it exists using the API
      try {
        const response = await axios.get(
          `http://localhost:9000/store/getEmailforPassword`,
          {
            params: {
              phoneNo: formData.emailOrPhone,
            },
          }
        );
  
        const data = response.data;
  
        if (data.customer) {
          // Phone number exists
          const encodedEmailOrPhone = encodeURIComponent(emailOrPhone);
          router.push(`/explore/verify-password?emailOrPhone=${encodedEmailOrPhone}`);        } else {
          // Phone number does not exist
          toast.error(`No account associated with phone number ${formData.emailOrPhone}.`);
        }
      } catch (error) {
        console.error("Error checking phone number:", error);
        toast.error("An error occurred. Please try again.");
      }
    } else {
      // It's an email, proceed with existing logic
      try {
        const response = await medusa.auth.exists(emailOrPhone);
        console.log(response);
  
        if (response.exists) {
          const encodedEmailOrPhone = encodeURIComponent(emailOrPhone);
          router.push(`/explore/verify-password?emailOrPhone=${encodedEmailOrPhone}`);
        } else {
          // Show toast if account does not exist
          toast.error("Account does not exist with this email.");
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        toast.error("An error occurred. Please try again.");
      }
    }
  };
  

  return (
    <div className="max-w-sm w-full flex flex-col items-center" data-testid="login-page">
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" onSubmit={handleFormSubmit}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email or Phone"
            name="emailOrPhone"
            type="text"
            title="Enter a valid email address or phone number."
            autoComplete="email"
            value={formData.emailOrPhone}
            onChange={handleInputChange}
            required
            data-testid="email-or-phone-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleInputChange}
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6 btn-second-custom text-large-regular text-white">
          Sign in
        </SubmitButton>
        <div className="flex mt-5 justify-end">
          <button
            type="button"
            onClick={handleForgotPassword} // Handle Forgot Password click
            className="underline text-ui-fg-base text-base-regular"
            data-testid="forgot-password-button"
          >
            Forgot Password?
          </button>
        </div>
      </form>

      <span className="text-center text-ui-fg-base text-base-regular mt-6">
        Not a member?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Join us
        </button>
        .
      </span>

      <ToastContainer />
    </div>
  );
};

export default Login;
