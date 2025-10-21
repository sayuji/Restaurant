import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Shield,
  Database,
  Printer,
  Receipt,
  Clock,
  CreditCard,
  Store,
  Phone,
  Mail,
  MapPin,
  Download,
  Upload,
  AlertTriangle
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    // Restaurant Information
    restaurantName: "RestoMaster Pro",
    restaurantPhone: "+62 812-3456-7890",
    restaurantEmail: "hello@restomaster.com",
    restaurantAddress: "Jl. Restoran No. 123, Jakarta",
    
    // Business Settings
    taxRate: 10,
    serviceCharge: 5,
    currency: "IDR",
    timezone: "Asia/Jakarta",
    
    // Print Settings
    printReceipt: true,
    printKitchen: true,
    receiptHeader: "Terima kasih telah berkunjung!",
    receiptFooter: "Silakan datang kembali!",
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    dailyReports: true,
    
    // Security Settings
    autoLogout: 30,
    passwordChangeDays: 90,
    twoFactorAuth: false,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    lastBackup: null
  });

  const [user, setUser] = useState({
    username: "admin",
    email: "admin@restomaster.com",
    role: "Administrator",
    lastLogin: new Date().toLocaleString()
  });

  const [activeTab, setActiveTab] = useState("general");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupType, setBackupType] = useState("");

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem("restaurantSettings")) || {};
    const savedUser = JSON.parse(localStorage.getItem("user")) || {};
    
    setSettings(prev => ({ ...prev, ...savedSettings }));
    setUser(prev => ({ ...prev, ...savedUser }));
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("restaurantSettings", JSON.stringify(settings));
  }, [settings]);

  const handleSaveSettings = () => {
    localStorage.setItem("restaurantSettings", JSON.stringify(settings));
    
    // Show success message
    alert("✅ Semua pengaturan berhasil disimpan!");
  };

  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      localStorage.removeItem("user");
      setIsLoggedIn(false);
      setTimeout(() => navigate("/login"), 1000);
    }
  };

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportData = () => {
    const data = {
      settings,
      menus: JSON.parse(localStorage.getItem("menus") || "[]"),
      tables: JSON.parse(localStorage.getItem("tables") || "[]"),
      orders: JSON.parse(localStorage.getItem("ordersDone") || "[]"),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `restomaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Update last backup time
    setSettings(prev => ({
      ...prev,
      lastBackup: new Date().toLocaleString()
    }));
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem("restaurantSettings", JSON.stringify(data.settings));
        }
        if (data.menus) {
          localStorage.setItem("menus", JSON.stringify(data.menus));
        }
        if (data.tables) {
          localStorage.setItem("tables", JSON.stringify(data.tables));
        }
        if (data.orders) {
          localStorage.setItem("ordersDone", JSON.stringify(data.orders));
        }
        
        alert("✅ Data berhasil diimport!");
        window.location.reload();
      } catch (error) {
        alert("❌ File backup tidak valid!");
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    if (window.confirm("Yakin ingin mengembalikan pengaturan ke default? Tindakan ini tidak dapat dibatalkan.")) {
      localStorage.removeItem("restaurantSettings");
      setSettings({
        restaurantName: "RestoMaster Pro",
        restaurantPhone: "+62 812-3456-7890",
        restaurantEmail: "hello@restomaster.com",
        restaurantAddress: "Jl. Restoran No. 123, Jakarta",
        taxRate: 10,
        serviceCharge: 5,
        currency: "IDR",
        timezone: "Asia/Jakarta",
        printReceipt: true,
        printKitchen: true,
        receiptHeader: "Terima kasih telah berkunjung!",
        receiptFooter: "Silakan datang kembali!",
        emailNotifications: true,
        smsNotifications: false,
        lowStockAlerts: true,
        dailyReports: true,
        autoLogout: 30,
        passwordChangeDays: 90,
        twoFactorAuth: false,
        autoBackup: true,
        backupFrequency: "daily",
        lastBackup: null
      });
    }
  };

  const tabs = [
    { id: "general", label: "Umum", icon: Settings2 },
    { id: "business", label: "Bisnis", icon: Store },
    { id: "print", label: "Print", icon: Printer },
    { id: "notifications", label: "Notifikasi", icon: Bell },
    { id: "security", label: "Keamanan", icon: Shield },
    { id: "backup", label: "Backup", icon: Database }
  ];

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-blue-600" />
                Pengaturan Sistem
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Kelola pengaturan restoran dan preferensi sistem
              </p>
            </div>
            
            <button
              onClick={handleSaveSettings}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Simpan Perubahan
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* User Info */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{user.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 justify-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors py-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* General Settings */}
            {activeTab === "general" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Store className="w-6 h-6 text-blue-600" />
                    Informasi Restoran
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Restoran
                      </label>
                      <input
                        type="text"
                        value={settings.restaurantName}
                        onChange={(e) => handleInputChange("general", "restaurantName", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telepon
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={settings.restaurantPhone}
                          onChange={(e) => handleInputChange("general", "restaurantPhone", e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={settings.restaurantEmail}
                          onChange={(e) => handleInputChange("general", "restaurantEmail", e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alamat
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <textarea
                          value={settings.restaurantAddress}
                          onChange={(e) => handleInputChange("general", "restaurantAddress", e.target.value)}
                          rows={3}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Palette className="w-6 h-6 text-purple-600" />
                    Tampilan
                  </h2>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Mode Tampilan</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Pilih tema terang atau gelap
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 ${
                        theme === "light"
                          ? "bg-gray-800 text-white hover:bg-gray-700"
                          : "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                      }`}
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="w-5 h-5" />
                          Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="w-5 h-5" />
                          Light Mode
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Business Settings */}
            {activeTab === "business" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-green-600" />
                    Pengaturan Bisnis
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pajak (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.taxRate}
                        onChange={(e) => handleInputChange("business", "taxRate", parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Service Charge (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.serviceCharge}
                        onChange={(e) => handleInputChange("business", "serviceCharge", parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mata Uang
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleInputChange("business", "currency", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="IDR">IDR - Rupiah Indonesia</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="SGD">SGD - Singapore Dollar</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Zona Waktu
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleInputChange("business", "timezone", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Asia/Jakarta">WIB (Jakarta)</option>
                        <option value="Asia/Makassar">WITA (Makassar)</option>
                        <option value="Asia/Jayapura">WIT (Jayapura)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Print Settings */}
            {activeTab === "print" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Printer className="w-6 h-6 text-orange-600" />
                    Pengaturan Print
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Print Struk Otomatis</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Print struk setelah pesanan selesai
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.printReceipt}
                          onChange={(e) => handleInputChange("print", "printReceipt", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Print ke Dapur</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Print order langsung ke dapur
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.printKitchen}
                          onChange={(e) => handleInputChange("print", "printKitchen", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Header Struk
                      </label>
                      <textarea
                        value={settings.receiptHeader}
                        onChange={(e) => handleInputChange("print", "receiptHeader", e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Pesan header untuk struk..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Footer Struk
                      </label>
                      <textarea
                        value={settings.receiptFooter}
                        onChange={(e) => handleInputChange("print", "receiptFooter", e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Pesan footer untuk struk..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === "notifications" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-yellow-600" />
                    Pengaturan Notifikasi
                  </h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: "emailNotifications", label: "Notifikasi Email", description: "Kirim notifikasi via email" },
                      { key: "smsNotifications", label: "Notifikasi SMS", description: "Kirim notifikasi via SMS" },
                      { key: "lowStockAlerts", label: "Alert Stok Rendah", description: "Notifikasi saat stok menu hampir habis" },
                      { key: "dailyReports", label: "Laporan Harian", description: "Kirim laporan harian otomatis" }
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{item.label}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[item.key]}
                            onChange={(e) => handleInputChange("notifications", item.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Shield className="w-6 h-6 text-red-600" />
                    Pengaturan Keamanan
                  </h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Auto Logout (menit)
                      </label>
                      <select
                        value={settings.autoLogout}
                        onChange={(e) => handleInputChange("security", "autoLogout", parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={15}>15 menit</option>
                        <option value={30}>30 menit</option>
                        <option value={60}>1 jam</option>
                        <option value={120}>2 jam</option>
                        <option value={0}>Tidak pernah</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ganti Password (hari)
                      </label>
                      <select
                        value={settings.passwordChangeDays}
                        onChange={(e) => handleInputChange("security", "passwordChangeDays", parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={30}>30 hari</option>
                        <option value={60}>60 hari</option>
                        <option value={90}>90 hari</option>
                        <option value={180}>180 hari</option>
                        <option value={365}>1 tahun</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tambahkan keamanan ekstra dengan 2FA
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorAuth}
                          onChange={(e) => handleInputChange("security", "twoFactorAuth", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === "backup" && (
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Database className="w-6 h-6 text-green-600" />
                    Backup & Restore
                  </h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Backup Otomatis</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Backup data secara otomatis
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => handleInputChange("backup", "autoBackup", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {settings.autoBackup && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Frekuensi Backup
                        </label>
                        <select
                          value={settings.backupFrequency}
                          onChange={(e) => handleInputChange("backup", "backupFrequency", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Harian</option>
                          <option value="weekly">Mingguan</option>
                          <option value="monthly">Bulanan</option>
                        </select>
                      </div>
                    )}
                    
                    {settings.lastBackup && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Backup terakhir:</strong> {settings.lastBackup}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={exportData}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200"
                      >
                        <Download className="w-5 h-5" />
                        Export Data
                      </button>
                      
                      <label className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Import Data
                        <input
                          type="file"
                          accept=".json"
                          onChange={importData}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={resetSettings}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors duration-200 w-full"
                      >
                        <AlertTriangle className="w-5 h-5" />
                        Reset ke Default
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-indigo-600" />
            Tentang Aplikasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">RestoMaster Pro</p>
              <p className="text-gray-600 dark:text-gray-400">v2.0.0</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">© 2024 RestoMaster</p>
              <p className="text-gray-600 dark:text-gray-400">All rights reserved</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">Support</p>
              <p className="text-gray-600 dark:text-gray-400">support@restomaster.com</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}