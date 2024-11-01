// SubmitButton component
"use client";

import { Button } from "@medusajs/ui";
import React from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  variant = "primary",
  className,
  "data-testid": dataTestId,
  disabled, // Add disabled prop here
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "transparent" | "danger" | null;
  className?: string;
  "data-testid"?: string;
  disabled?: boolean; // Add disabled prop type here
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      size="large"
      className={className}
      type="submit"
      isLoading={pending}
      variant={variant}
      disabled={disabled} // Pass disabled prop to Button
      data-testid={dataTestId}
      style={{ borderRadius: "0px" }}
    >
      {children}
    </Button>
  );
}
