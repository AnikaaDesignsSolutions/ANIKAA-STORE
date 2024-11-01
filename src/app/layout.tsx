"use client";

// import { Metadata } from "next";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"; // Import ThemeProvider, createTheme, and CssBaseline
import "styles/globals.css";

// Define the base URL for metadata
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000";

// Define the metadata for the page
// export const metadata: Metadata = {
//   metadataBase: new URL(BASE_URL),
// };

// Create a custom theme for Material UI
const theme = createTheme({
  typography: {
    fontFamily: "Caudex, Arial, sans-serif", // Set the desired font family
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Caudex';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: url('/fonts/caudex.regular.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Caudex';
          font-style: normal;
          font-display: swap;
          font-weight: 700;
          src: url('/fonts/caudex.bold.ttf') format('truetype');
        }
      `,
    },
  },
});

// The main RootLayout component with ThemeProvider applied
export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        {/* Wrap the content with the ThemeProvider */}
        <ThemeProvider theme={theme}>
          {/* Apply the Material UI baseline styles */}
          <CssBaseline />
          {/* Render the content inside the main layout */}
          <main className="relative">{props.children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
