import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext"; // ⬅️ tambahkan ini

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <ThemeProvider> {/* ⬅️ Bungkus seluruh App */}
        <App />
        {/* ⬇️ Toaster biar tetap bisa muncul */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "10px",
              padding: "10px 16px",
            },
          }}
        />
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
