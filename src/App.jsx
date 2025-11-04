import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import Checkout from "./pages/Checkout";
import ListOrders from "./pages/ListOrders";
import Tables from "./pages/Tables";
import Receipts from './pages/Receipts';
import Settings from "./pages/Settings";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import HistoryOrders from "./pages/HistoryOrders";
import TitleManager from "./components/TitleManager";
import UserManagement from './pages/UserManagement';

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <TitleManager />

      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes dengan Role-based Access */}
        
        {/* Dashboard - Accessible by all authenticated users */}
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

        {/* Menu Management - Admin & Manager only */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager']}>
              <MainLayout>
                <Menu />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Customer Orders - Accessible by all (for order taking) */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Orders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Checkout - Cashier & above */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager', 'cashier']}>
              <MainLayout>
                <Checkout />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Kitchen Orders - Kitchen staff & above */}
        <Route
          path="/list-orders"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager', 'kitchen']}>
              <MainLayout>
                <ListOrders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Table Management - Admin & Manager only */}
        <Route
          path="/tables"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager']}>
              <MainLayout>
                <Tables />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receipts"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager', 'cashier']}>
              <MainLayout>
                <Receipts />
              </MainLayout>
            </ProtectedRoute>
          }
        />  

        {/* Settings - Admin only */}
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Order History - Manager & above */}
        <Route
          path="/history-orders"
          element={
            <ProtectedRoute requiredAnyRole={['admin', 'manager']}>
              <MainLayout>
                <HistoryOrders />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <MainLayout>
                <UserManagement />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* Fallback route - 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
                <p className="text-gray-600 dark:text-gray-400">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}