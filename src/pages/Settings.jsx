import { useState } from "react";
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
import { useTheme } from "../context/ThemeContext"; // ⬅️ pakai context global

export default function Settings() {
  const { theme, toggleTheme } = useTheme(); // ⬅️ ambil dari context
  const [username, setUsername] = useState("admin");
  const [email, setEmail] = useState("admin@example.com");
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [language, setLanguage] = useState("id");
  const [dashboardLayout, setDashboardLayout] = useState("compact");
  const [dateFormat, setDateFormat] = useState("dd/mm/yyyy");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // 💾 Simpan Perubahan
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
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-8 transition-all duration-500">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-blue-600" /> Pengaturan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Kelola preferensi akun, tampilan, dan pengaturan aplikasi kamu.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 🧑 Akun */}
        <motion.div
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Akun Pengguna
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Bahasa Aplikasi
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </motion.div>

        {/* 🔔 Notifikasi */}
        <motion.div
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-green-500" /> Preferensi Aplikasi
          </h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Tata Letak Dashboard
            </label>
            <select
              value={dashboardLayout}
              onChange={(e) => setDashboardLayout(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="compact">Kompak</option>
              <option value="spacious">Luas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Format Tanggal
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-indigo-600" /> Tentang Aplikasi
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
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
