import React from "react";
import { Metadata } from "next";
import { getCustomer, listRegions } from "@lib/data";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient"; // Import the client-side component

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Anikaa Store profile.",
};

export default async function ProfilePage() {
  const customer = await getCustomer();
  const regions = await listRegions();

  if (!customer || !regions) {
    notFound();
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <ProfileClient customer={customer} regions={regions} />
    </div>
  );
}
