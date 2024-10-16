import Medusa from "@medusajs/medusa-js"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"
let MEDUSA_FRONTEND_URL = "http://localhost:8000"

if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}
if (process.env.NEXT_PUBLIC_BASE_URL) {
  console.log('process.env.NEXT_PUBLIC_BASE_URL', process.env.NEXT_PUBLIC_BASE_URL)
  MEDUSA_FRONTEND_URL = process.env.NEXT_PUBLIC_BASE_URL
}

export const medusaClient = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
})


export { MEDUSA_BACKEND_URL, MEDUSA_FRONTEND_URL }

