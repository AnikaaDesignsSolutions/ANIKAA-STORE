"use client";

import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { useEffect } from 'react';
import "styles/globals.css";

// Create a custom theme for Material UI
const theme = createTheme({
  typography: {
    fontFamily: "Caudex, Arial, sans-serif",
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

// The main RootLayout component with ThemeProvider and service worker registration
export default function RootLayout(props: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/in/sw.js").then(
        (registration) => console.log("Service Worker registered:", registration),
        (err) => console.error("Service Worker registration failed:", err)
      );
    }
  }, []);
  

  return (
    <html lang="en" data-mode="light">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <main className="relative">{props.children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
