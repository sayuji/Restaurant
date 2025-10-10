import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Utensils,
  ShoppingCart,
  Table,
  LogOut,
  List,
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
    { name: "Tables", icon: <Table size={20} />, path: "/tables" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between">
        <div>
          <div className="text-2xl font-bold text-center py-6 border-b border-gray-200">
            🍽️ Restaurant App
          </div>
          <nav className="p-4 space-y-3">
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
          </nav>
        </div>

        {/* Tombol logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
