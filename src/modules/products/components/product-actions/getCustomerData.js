"use server";

import { getCustomer } from "@lib/data";

// Utility function to fetch customer data
export const fetchCustomerData = async () => {
  try {
    const customer = await getCustomer();
    return customer;
  } catch (error) {
    console.error("Error fetching customer data:", error);
    return null;
  }
};
