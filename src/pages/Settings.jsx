import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  LogOut,
  User,
  Info,
  Bell,
  Palette,
  Settings2,
  Save,
  LayoutGrid,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("admin@example.com");
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [language, setLanguage] = useState("id");
  const [dashboardLayout, setDashboardLayout] = useState("compact");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // ✅ Default tema putih
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  // 🌙 Ganti tema
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // 💾 Simpan perubahan
  const handleSave = () => {
    alert("✅ Semua perubahan berhasil disimpan!");
  };

  // 🚪 Logout
  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      localStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
      window.location.href = "/login";
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-800 p-8 transition-all duration-500">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold flex items-center gap-3 text-gray-800">
          <Settings2 className="w-8 h-8 text-blue-600" /> Pengaturan
        </h1>
        <p className="text-gray-500 mt-2">
          Kelola preferensi akun, tampilan, dan pengaturan aplikasi kamu.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 🧑 Akun */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <User className="w-5 h-5 text-blue-600" /> Akun Pengguna
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>

        {/* 🎨 Tampilan */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <Palette className="w-5 h-5 text-purple-600" /> Tampilan
          </h2>
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-medium">Mode Tampilan</p>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 ${
                theme === "light"
                  ? "bg-gray-800 text-white hover:bg-gray-700"
                  : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
              }`}
            >
              {theme === "light" ? (
                <>
                  <Moon className="w-4 h-4" /> Dark Mode
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" /> Light Mode
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Bahasa Aplikasi
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </motion.div>

        {/* 🔔 Notifikasi */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <Bell className="w-5 h-5 text-yellow-500" /> Notifikasi
          </h2>
          <div className="flex items-center justify-between mb-4">
            <span>Aktifkan Notifikasi</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="w-5 h-5 accent-blue-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Update Otomatis</span>
            <input
              type="checkbox"
              checked={autoUpdate}
              onChange={() => setAutoUpdate(!autoUpdate)}
              className="w-5 h-5 accent-blue-600"
            />
          </div>
        </motion.div>

        {/* ⚙️ Preferensi Aplikasi */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <LayoutGrid className="w-5 h-5 text-green-500" /> Preferensi Aplikasi
          </h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-1">
              Tata Letak Dashboard
            </label>
            <select
              value={dashboardLayout}
              onChange={(e) => setDashboardLayout(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="compact">Kompak</option>
              <option value="spacious">Luas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Format Tanggal
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="mm/dd/yyyy">MM/DD/YYYY</option>
              <option value="yyyy/mm/dd">YYYY/MM/DD</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* ℹ️ Tentang Aplikasi */}
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2 text-gray-700">
          <Info className="w-5 h-5 text-indigo-600" /> Tentang Aplikasi
        </h2>
        <p className="text-gray-600 mb-4">
          <strong>Sistem Manajemen Restoran v1.0</strong> — dibuat dengan ❤️
          menggunakan React + Tailwind CSS + Framer Motion.
        </p>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          <Save className="w-4 h-4" /> Simpan Perubahan
        </button>
      </motion.div>
    </div>
  );
}
