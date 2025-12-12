import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import { AuthProvider } from "@/contexts/AuthContext"
import { ToastProvider } from "@/contexts/ToastContext"
import App from "./App"
import "./index.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element #root not found in document.")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
)
