import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Utensils,
  ShoppingCart,
  Table,
  LogOut,
  List,
  Settings,
  Clock,
} from "lucide-react";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/" },
    { name: "Menu", icon: <Utensils size={20} />, path: "/menu" },
    { name: "Orders", icon: <ShoppingCart size={20} />, path: "/orders" },
    { name: "List Orders", icon: <List size={20} />, path: "/list-orders" },
    { name: "History", icon: <Clock size={20} />, path: "/history-orders" },
    { name: "Tables", icon: <Table size={20} />, path: "/tables" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed left-0 top-0 h-full z-10">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="text-2xl font-bold text-center py-6 border-b border-gray-200 flex-shrink-0">
            🍽️ Restaurant App
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-2 rounded-lg transition font-medium hover:bg-gray-100 ${
                  window.location.pathname === item.path
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            {/* ✅ Settings menu item */}
            <Link
              to="/settings"
              className={`flex items-center gap-3 p-2 rounded-lg transition font-medium hover:bg-gray-100 ${
                window.location.pathname === "/settings"
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-700"
              }`}
            >
              <Settings size={20} />
              Settings
            </Link>
          </nav>
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 h-full overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
