import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import ListOrders from "./pages/ListOrders";
import Tables from "./pages/Tables";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Semua halaman login-protected dibungkus MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/menu"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Menu />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/list-orders"
        element={
          <ProtectedRoute>
            <ListOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tables"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Tables />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
