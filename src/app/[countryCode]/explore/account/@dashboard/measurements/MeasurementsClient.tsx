// app/[countryCode]/explore/account/@dashboard/measurements/MeasurementsClient.tsx
"use client"

import React, { useEffect, useState } from "react"
import MeasurementsTable from "./MeasurementsTable"
import { MEDUSA_BACKEND_URL } from "@lib/config"

interface MeasurementData {
  [customerName: string]: {
    [productName: string]: {
      [attribute: string]: number
    }
  }
}

interface MeasurementsClientProps {
  customerId: string
  categories: Array<{
    id: string
    name: string
    description: string
  }>
}

const MeasurementsClient: React.FC<MeasurementsClientProps> = ({ customerId, categories }) => {
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        const response = await fetch(
          `${MEDUSA_BACKEND_URL}/store/customer_product_measurements?id=${customerId}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch customer measurements")
        }
        const data = await response.json()
        setMeasurements(data.customer_product_measurement)
      } catch (error) {
        setError((error as Error).message)
      }
    }

    fetchMeasurements()
  }, [customerId])

  return (
    <div className="w-full p-6" data-testid="measurements-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Customer Measurements</h1>
        <p className="text-base-regular">
          View detailed measurements associated with each product and customer name.
        </p>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {/* <hr className="my-6" /> */}

      {/* Pass categories to MeasurementsTable */}
      <MeasurementsTable customerId={customerId} categories={categories} />
    </div>
  )
}

const Divider = () => <div className="w-full h-px bg-gray-200 my-4" />

export default MeasurementsClient
