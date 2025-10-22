import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { useEffect, useState } from "react";

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token"); // Clear token as well
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
    { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  // Check if current path matches menu item
  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item }) => (
    <Link
      to={item.path}
      className={`flex items-center gap-3 p-3 rounded-lg transition font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isActivePath(item.path)
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500"
          : "text-gray-700 dark:text-gray-300"
      }`}
    >
      {item.icon}
      <span>{item.name}</span>
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-20 p-4 flex justify-between items-center">
        <div className="text-xl font-bold">🍽️ RestoMaster</div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col fixed left-0 top-0 h-full z-10 
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Hidden on mobile */}
          <div className="text-2xl font-bold text-center py-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 lg:block hidden">
            🍽️ RestoMaster
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-16 lg:mt-0">
            {menuItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-semibold transition border border-red-200 dark:border-red-800"
          >
            <LogOut size={18} /> 
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 h-full overflow-y-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 min-h-full">{children}</div>
      </main>
    </div>
  );
}