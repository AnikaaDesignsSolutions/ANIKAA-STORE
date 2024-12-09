import React from "react";

import { IconProps } from "types/icon";

const PrivacyAndDataPolicy: React.FC<IconProps> = ({
  size = "16",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M12 2C8.5 3.7 5 4.5 5 8.5V14.5C5 18.5 8.8 21 12 22C15.2 21 19 18.5 19 14.5V8.5C19 4.5 15.5 3.7 12 2Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.5V8.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="15.5"
        r="0.75"
        fill={color}
      />
    </svg>
  );
};

export default PrivacyAndDataPolicy;
