"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000).toString(); // Generate 5-digit OTP
};

const VerifyPasswordPage = () => {
  const [otp, setOtp] = useState(''); // OTP field no longer auto-filled
  const [generatedOtp, setGeneratedOtp] = useState(generateOtp()); // Store the generated OTP
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes (180 seconds)
  const [isOtpValid, setIsOtpValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState(''); // To store error message for invalid OTP
  const searchParams = useSearchParams();
  const router = useRouter(); // Use Next.js router for navigation
  const emailOrPhone = searchParams.get('emailOrPhone');

  // Function to check if it's a phone number or email
  const isPhoneNumber = (emailOrPhone: string | null) => {
    return emailOrPhone && !emailOrPhone.includes('@');
  };

  // Function to extract the phone number from the email-like string
  const extractPhoneNumber = (emailOrPhone: string | null) => {
    if (emailOrPhone) {
      return emailOrPhone.replace('@unidentified.com', '');
    }
    return '';
  };

  // Send OTP via Twilio if phone number, else via email
  const sendOtpToEmailOrPhone = async (otpToSend: string) => {
    try {
      if (!emailOrPhone ) {
        console.error('No email or phone number provided or OTP already sent');
        return;
      }

      console.log("Sending OTP to", emailOrPhone);

      if (isPhoneNumber(emailOrPhone)) {
        const phoneNumber = emailOrPhone;

       // Make sure all required environment variables are defined
const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !fromPhoneNumber) {
  console.error("Twilio credentials are missing in environment variables.");
  return;
}

try {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Ensure all fields are defined before constructing the params
  const params = new URLSearchParams();
  params.append("To", phoneNumber);
  params.append("From", fromPhoneNumber);
  params.append("Body", `Your OTP to reset password for Anikaa Store Account is: ${otpToSend}`);

  const response = await axios.post(url, params, {
    auth: {
      username: accountSid,
      password: authToken,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (response.status === 201) {
    console.log("OTP sent via SMS to:", phoneNumber);
  } else {
    console.error("Failed to send OTP via SMS:", response.data.message);
  }
} catch (error) {
  console.error("Error sending OTP:", error);
}

      } else {
        // API call to send the OTP via email
        const email = emailOrPhone;
        const response = await axios.post('http://localhost:9000/store/otpMail', {
          email: email,
          otp: otpToSend, // Use the OTP passed to the function
        });

        if (response.status === 200) {
          console.log('OTP sent to:', email);
        } else {
          console.error('Failed to send OTP:', response.data.message);
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  // Call the function when the OTP is generated
  useEffect(() => {
    if (emailOrPhone ) {
      console.log('Generated OTP:', generatedOtp);
      sendOtpToEmailOrPhone(generatedOtp); // Send the OTP when it is generated
    } else if (!emailOrPhone) {
      console.error('emailOrPhone is null or undefined');
    }
  }, [emailOrPhone]); // Only trigger when emailOrPhone is available and valid

  // Handle OTP input change
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 5) {
      setOtp(e.target.value);
    }
  };

  // Handle OTP generation and reset timer
  const resetOtp = () => {
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp); // Generate a new OTP
    setTimeLeft(300); // 5 minutes (300 seconds)
    setIsOtpValid(true);
    setErrorMessage(''); // Reset error message
    sendOtpToEmailOrPhone(newOtp); // Send the newly generated OTP via phone or email
  };

  // Countdown effect to track the OTP's validity period
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setIsOtpValid(false); // Expire the OTP once the time is up
    }
  }, [timeLeft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpValid && otp === generatedOtp) {
      console.log('OTP Submitted and verified:', otp);
      // Pass emailOrPhone to reset-password page
      router.push(`/explore/reset-password?emailOrPhone=${encodeURIComponent(emailOrPhone || '')}`);
    } else {
      setErrorMessage('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="h-auto flex justify-center items-center py-10">
      <div className="max-w-sm w-full flex flex-col items-center bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-large-semi uppercase mb-6">Reset Password</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          We've sent a 5-digit OTP to{' '}
          {isPhoneNumber(emailOrPhone) ? extractPhoneNumber(emailOrPhone) : emailOrPhone}.
          Please enter the OTP below to reset your password.
        </p>
        <form className="w-full" onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp} // User manually enters the OTP
            onChange={handleOtpChange}
            maxLength={5}
            placeholder="Enter 5-digit OTP"
            className="w-full text-center border p-2 mb-4"
          />
          {/* Display OTP expiration time here with color #e88b9a */}
          <p className="text-center text-sm">
            The OTP will expire in <span style={{ color: '#e88b9a' }}>{Math.floor(timeLeft / 60)}:{('0' + (timeLeft % 60)).slice(-2)}.</span>
          </p>
          {/* Display error message for invalid OTP */}
          {errorMessage && (
            <p className="text-red-500 text-center text-sm">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 btn-second-custom text-large-regular text-white bg-blue-500 p-3 rounded-lg"
          >
            Verify OTP
          </button>
        </form>
        <button
          onClick={resetOtp}
          disabled={isOtpValid && timeLeft > 0} // Disable the button if the current OTP is still valid
          className="w-full mt-4 bg-gray-300 text-black p-3 rounded-lg"
        >
          Reset OTP
        </button>
      </div>
    </div>
  );
};

export default VerifyPasswordPage;

