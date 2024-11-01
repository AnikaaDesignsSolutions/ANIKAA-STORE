// app/[countryCode]/explore/account/@dashboard/measurements/page.tsx
import React from "react"
import { Metadata } from "next";
import { getCustomer, getCategoriesList } from "@lib/data"
import MeasurementsClient from "./MeasurementsClient"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Customer Measurements",
  description: "View and edit customer measurements",
};


export default async function MeasurementsPage() {
  const customer = await getCustomer()
  const categories = await getCategoriesList()

  if (!customer) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="measurements-page-wrapper">
      <MeasurementsClient customerId={customer.id} categories={categories.product_categories} />
    </div>
  )
}
