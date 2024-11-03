import { Metadata } from "next"
import "styles/globals.css"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  title: "Anikaa App",
  description: "Generated by Anikaa app",
  manifest: "/in/manifest.json",
  keywords: ["customized dress","tailormade dress","online tailoring"],
  viewport: "minimum-scale=1,initial-scale=1,width=device-width,shrink-to-fit=no,viewport-fit=cover",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
