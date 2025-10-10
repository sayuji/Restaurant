import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // ⬅️ tambahkan ini
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <App />
      {/* ⬇️ ini buat munculin notifikasi toast di kanan bawah */}
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
    </Router>
  </React.StrictMode>
);
