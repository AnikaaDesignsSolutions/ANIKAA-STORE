import React, { useEffect, useState } from "react"
import axios from "axios"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons"

interface MeasurementData {
  [customerName: string]: {
    [categoryName: string]: {
      [attribute: string]: number
    }
  }
}

interface Category {
  id: string
  name: string
  description: string
}

const MeasurementsTable: React.FC<{ customerId: string; categories: Category[] }> = ({ customerId, categories }) => {
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attributes, setAttributes] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [newCustomer, setNewCustomer] = useState<string>("")
  const [existingCustomers, setExistingCustomers] = useState<string[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [editProductName, setEditProductName] = useState<string>("")
  const [newMeasurement, setNewMeasurement] = useState({
    customerName: "",
    categoryName: "",
    attributes: {} as Record<string, number>,
  })
  const [editableAttributes, setEditableAttributes] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        const response = await fetch(
          `http://localhost:9000/store/customer_product_measurements?id=${customerId}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch customer measurements")
        }
        const data = await response.json()
        setMeasurements(data.customer_product_measurement)
        setExistingCustomers(Object.keys(data.customer_product_measurement))
      } catch (error) {
        setError((error as Error).message)
      }
    }

    fetchMeasurements()
  }, [customerId])

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value
    setSelectedCategory(categoryId)
    setAttributes([])

    const selectedCategoryName = categories.find((category) => category.id === categoryId)?.name || ""
    setNewMeasurement((prev) => ({ ...prev, categoryName: selectedCategoryName }))

    try {
      const response = await axios.get(
        `http://localhost:9000/store/categoryMeasurement?category_id=${categoryId}`
      )
      const data = response.data.data[0]?.measurements || []
      const extractedAttributes = data.map((attr: any) =>
        typeof attr === "object" && attr.attributeName ? attr.attributeName : attr
      )
      setAttributes(extractedAttributes)
    } catch (error) {
      console.error("Error fetching attributes:", error)
    }
  }

  useEffect(() => {
    if (attributes.length > 0) {
      const defaultAttributes: Record<string, number> = {}
      attributes.forEach((attr) => {
        defaultAttributes[attr] = 0
      })
      setNewMeasurement((prev) => ({
        ...prev,
        attributes: defaultAttributes,
      }))
    }
  }, [attributes])

  const areAttributesValid = (attributesObj: Record<string, number>) => {
    return Object.values(attributesObj).every((value) => value > 0)
  }

  const customerNameEntered = newCustomer || selectedCustomer

  const handleAddMeasurement = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isFormValid()) {
      setError("Please fill in all required fields with valid values.")
      return
    }

    const customerName = newCustomer || selectedCustomer
    const { categoryName, attributes } = newMeasurement

    const updatedMeasurements = {
      ...measurements,
      [customerName]: {
        ...(measurements?.[customerName] || {}),
        [categoryName]: {
          ...(measurements?.[customerName]?.[categoryName] || {}),
          ...attributes,
        },
      },
    }

    try {
      const response = await fetch("http://localhost:9000/store/customer_product_measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          customer_product_measurement: updatedMeasurements,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add or edit measurement")
      }

      setMeasurements(updatedMeasurements)
      resetForm()
      setError(null)
    } catch (error) {
      setError((error as Error).message)
    }
  }

  const isFormValid = () => {
    const customerNameEntered = newCustomer || selectedCustomer
    return (
      customerNameEntered &&
      selectedCategory &&
      areAttributesValid(newMeasurement.attributes)
    )
  }

  const handleEditMeasurement = (customerName: string, productName: string, attributes: Record<string, number>) => {
    setIsEditing(true)
    setEditProductName(productName)
    setSelectedCustomer(customerName)
    setEditableAttributes(attributes)
  }

  const handleDeleteMeasurement = async (customerName: string, productName: string) => {
    if (!measurements) return

    try {
      const response = await fetch("http://localhost:9000/store/customer_product_measurements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          customerName,
          productName
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete measurement")
      }

      const updatedMeasurements = { ...measurements }
      delete updatedMeasurements[customerName][productName]

      if (Object.keys(updatedMeasurements[customerName]).length === 0) {
        delete updatedMeasurements[customerName]
      }

      setMeasurements(updatedMeasurements)
      setError(null)
    } catch (error) {
      setError((error as Error).message)
    }
  }

  const handleAttributeChange = (attributeName: string, value: number) => {
    setEditableAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }))
  }

  const submitEditedAttributes = async () => {
    if (!selectedCustomer || !editProductName || !measurements) return

    const updatedMeasurements = {
      ...measurements,
      [selectedCustomer]: {
        ...(measurements[selectedCustomer] || {}),
        [editProductName]: {
          ...editableAttributes,
        },
      },
    }

    try {
      const response = await fetch("http://localhost:9000/store/customer_product_measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          customer_product_measurement: updatedMeasurements,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update measurements")
      }

      setMeasurements(updatedMeasurements)
      resetForm()
    } catch (error) {
      setError((error as Error).message)
    }
  }

  const resetForm = () => {
    setNewMeasurement({ customerName: "", categoryName: "", attributes: {} })
    setNewCustomer("")
    setSelectedCustomer("")
    setSelectedCategory("")
    setIsEditing(false)
    setEditProductName("")
    setEditableAttributes({})
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8" data-testid="measurements-page-wrapper">
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {measurements ? (
        Object.entries(measurements).map(([customerName, products]) => (
          <div key={customerName} className="customer-section mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">{customerName}</h2>
            <div className="flex flex-col gap-y-4">
              {Object.entries(products).map(([productName, attributes]) => (
                <div key={productName} className="product-section mb-4 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{productName}</h3>
                  {isEditing && editProductName === productName && selectedCustomer === customerName ? (
                    <table className="text-sm w-full">
                      <tbody>
                        {Object.entries(editableAttributes).map(([attr, value]) => (
                          <tr key={attr}>
                            <td className="p-1">{attr}</td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={value}
                                onChange={(e) => handleAttributeChange(attr, Number(e.target.value))}
                                className="p-1 border border-gray-300 rounded w-16"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <ul className="text-sm">
                      {Object.entries(attributes).map(([attributeName, value]) => (
                        <li key={attributeName} className="flex justify-between">
                          <span>{attributeName}</span>
                          <span>{value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-2">
                    {!isEditing && (
                      <button onClick={() => handleEditMeasurement(customerName, productName, attributes)} className="p-1 rounded">
                        <FontAwesomeIcon icon={faEdit} /> Edit
                      </button>
                    )}
                    <button onClick={() => handleDeleteMeasurement(customerName, productName)} className="p-1 rounded">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    {isEditing && editProductName === productName && selectedCustomer === customerName && (
                      <button onClick={submitEditedAttributes} className="p-2 border rounded" disabled={!areAttributesValid(editableAttributes)}>
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p>Loading measurements...</p>
      )}

      <hr className="my-6" />

      <h2 className="text-lg sm:text-xl font-semibold mb-4">Add New Product Measurement</h2>
      <form onSubmit={handleAddMeasurement} className="flex flex-col gap-y-4">
        
        <div className="flex flex-col sm:flex-row gap-4">
          {existingCustomers.length > 0 && (
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value)
                setNewCustomer("")
              }}
              className="p-2 border border-gray-300 rounded w-full sm:w-1/2"
            >
              <option value="">Select Existing Customer</option>
              {existingCustomers.map((customer) => (
                <option key={customer} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder={existingCustomers.length > 0 ? "Or Enter New User Name" : "Enter a User Name"}
            value={newCustomer}
            onChange={(e) => {
              setNewCustomer(e.target.value)
              setSelectedCustomer("")
            }}
            className="p-2 border border-gray-300 rounded w-full sm:w-1/2"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="p-2 border border-gray-300 rounded w-full"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {attributes.map((attr) => (
          <div key={attr} className="flex flex-col sm:flex-row gap-x-2 items-center">
            <label className="w-full sm:w-1/3">{attr}</label>
            <input
              type="number"
              placeholder="Value"
              value={newMeasurement.attributes[attr] || ""}
              onChange={(e) =>
                setNewMeasurement((prev) => ({
                  ...prev,
                  attributes: { ...prev.attributes, [attr]: Number(e.target.value) },
                }))
              }
              className="p-2 border border-gray-300 rounded w-full sm:w-2/3"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={!isFormValid()}
          className={`p-2 text-white rounded ${isFormValid() ? "bg-[#fc8b9c] hover:bg-[#56242e]" : "bg-gray-400"}`}
        >
          Add Measurement
        </button>
      </form>
    </div>
  )
}

export default MeasurementsTable
