import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer-main"
import Nav from "@modules/layout/templates/nav-others"
import ChatFooter from "@modules/layout/templates/chat-footer/ChatFooter"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <div style={{fontFamily:"Caudex"}}>
      <Nav />
      {props.children}
      <Footer />
      <ChatFooter />
    </div>
  )
}
