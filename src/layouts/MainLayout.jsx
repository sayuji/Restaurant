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
  User,
  Users,
  Receipt
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, hasAnyRole } from "../services/api";
import toast from "react-hot-toast";

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Simulate logout process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Berhasil logout");
      navigate("/login");
    } catch (error) {
      toast.error("Gagal logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Konfirmasi Logout
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Yakin ingin keluar dari sistem?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleLogout();
              }}
              disabled={isLoggingOut}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging out...
                </>
              ) : (
                'Ya, Logout'
              )}
            </button>
          </div>
        </div>
      </div>
    ));
  };

  // 🔥 MENU ITEMS BERDASARKAN ROLE
  const getMenuItems = () => {
    const allMenuItems = [
      { 
        name: "Dashboard", 
        icon: <Home size={20} />, 
        path: "/", 
        roles: ['admin', 'manager', 'kitchen', 'cashier']
      },
      
      // Menu Management - Admin & Manager only
      { 
        name: "Menu", 
        icon: <Utensils size={20} />, 
        path: "/menu", 
        roles: ['admin', 'manager']
      },
      
      // Orders - Semua role bisa akses
      { 
        name: "Orders", 
        icon: <ShoppingCart size={20} />, 
        path: "/orders", 
        roles: ['admin', 'manager', 'kitchen', 'cashier']
      },
      
      // List Orders - Kitchen staff & above
      { 
        name: "List Orders", 
        icon: <List size={20} />, 
        path: "/list-orders", 
        roles: ['admin', 'manager', 'kitchen']
      },
      
      // History - Manager & above
      { 
        name: "History", 
        icon: <Clock size={20} />, 
        path: "/history-orders", 
        roles: ['admin', 'manager']
      },
      
      { 
        name: "Recipts", 
        icon: <Receipt size={20} />, 
        path: "/receipts", 
        roles: ['admin', 'manager', 'cashier']
      },

      // Tables - Admin & Manager only
      { 
        name: "Tables", 
        icon: <Table size={20} />, 
        path: "/tables", 
        roles: ['admin', 'manager']
      },
      
      { 
        name: "User Management", 
        icon: <Users size={20} />, 
        path: "/users", 
        roles: ['admin']
      },
      
      // Settings - Admin only
      { 
        name: "Settings", 
        icon: <Settings size={20} />, 
        path: "/settings", 
        roles: ['admin']
      },
    ];

    // Filter menu berdasarkan role user
    return allMenuItems.filter(item => 
      item.roles.includes(user?.role)
    );
  };

  const menuItems = getMenuItems();

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
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${
        isActivePath(item.path)
          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
          : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      }`}
    >
      <div className={`p-2 rounded-lg transition-colors ${
        isActivePath(item.path) 
          ? "bg-white/20" 
          : "bg-gray-100 dark:bg-gray-700"
      }`}>
        {item.icon}
      </div>
      <span>{item.name}</span>
    </Link>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg z-50 p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">RestoMaster</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col fixed left-0 top-0 h-full z-40 
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Hidden on mobile */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 lg:block hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Utensils className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">RestoMaster</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Restaurant Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
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
            onClick={confirmLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-semibold transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={18} /> 
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 h-full overflow-y-auto bg-white dark:bg-gray-900 transition-colors duration-300 pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 min-h-full">{children}</div>
      </main>
    </div>
  );
}