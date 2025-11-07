import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  X,
  Users,
  Table as TableIcon,
  Clock,
  CheckCircle,
  Loader,
  Filter
} from "lucide-react";
import { decryptTableParam, getQueryParam, isValidEncryptedParam } from "../utils/encryption";
import { useTheme } from "../context/ThemeContext";
import { menuAPI, ordersAPI, tablesAPI } from '../services/api';
import toast from "react-hot-toast";

export default function Orders() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([{ value: "all", label: "Semua Menu" }]);
  const [menus, setMenus] = useState([]);
  const [isOrderSummaryCollapsed, setIsOrderSummaryCollapsed] = useState(true);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // 🔥 LOAD DATA DARI DATABASE - SAMA PATTERN DENGAN MENU.JSX
  useEffect(() => {
    loadTablesFromBackend();
    loadMenusFromBackend();
    
    // Handle table parameter dari URL
    const encryptedTableParam = getQueryParam("table", location.search ? `${window.location.origin}${location.pathname}${location.search}` : window.location.href);
    
    if (encryptedTableParam && isValidEncryptedParam(encryptedTableParam)) {
      const decryptedTableId = decryptTableParam(encryptedTableParam);
      // Table akan di-set setelah data tables loaded
    } else {
      setShowTableSelector(true);
    }
  }, [location.search, location.pathname]);

  // 🔥 LOAD TABLES DARI DATABASE
  const loadTablesFromBackend = async () => {
    try {
      setTableLoading(true);
      console.log('🔄 Loading tables dari database...');
      const response = await tablesAPI.getAll();
      const tablesData = response.data || [];
      setAvailableTables(tablesData);
      console.log('✅ Tables loaded:', tablesData.length);
      
      // Handle table selection dari URL parameter
      const encryptedTableParam = getQueryParam("table", location.search ? `${window.location.origin}${location.pathname}${location.search}` : window.location.href);
      
      if (encryptedTableParam && isValidEncryptedParam(encryptedTableParam)) {
        const decryptedTableId = decryptTableParam(encryptedTableParam);
        const foundTable = tablesData.find(table => table.id.toString() === decryptedTableId);
        
        if (foundTable) {
          setSelectedTable(foundTable);
          setShowTableSelector(false);
          console.log('✅ Table selected from URL:', foundTable.name);
        } else {
          setShowTableSelector(true);
          console.log('❌ Table not found from URL, showing selector');
        }
      } else {
        setShowTableSelector(true);
      }
      
    } catch (error) {
      console.error('❌ Gagal memuat tables dari backend:', error);
      toast.error("Gagal memuat data meja");
      // Fallback ke localStorage
      try {
        const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
        setAvailableTables(savedTables);
        console.log('🔄 Using localStorage fallback for tables');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    } finally {
      setTableLoading(false);
    }
  };

  // 🔥 LOAD MENUS DARI DATABASE - SAMA PERSIS DENGAN MENU.JSX
  const loadMenusFromBackend = async () => {
    try {
      console.log('🔄 Loading menus dari database...');
      const menusData = await menuAPI.getAll();
      setMenus(menusData);
      console.log('✅ Menus loaded:', menusData.length);

      // Extract categories dari menus
      const uniqueCats = [
        { value: "all", label: "Semua Menu" },
        ...new Map(menusData
          .filter(menu => menu.category && menu.category.value)
          .map((m) => [m.category.value, m.category])
        ).values(),
      ];
      setCategories(uniqueCats);
      toast.success("Menu berhasil dimuat");
      
    } catch (error) {
      console.error('❌ Gagal memuat menu dari backend:', error);
      toast.error("Gagal memuat data menu");
      // Fallback ke localStorage
      try {
        const savedMenus = JSON.parse(localStorage.getItem("menus") || "[]");
        if (Array.isArray(savedMenus)) {
          setMenus(savedMenus);
          
          const uniqueCats = [
            { value: "all", label: "Semua Menu" },
            ...new Map(savedMenus
              .filter(menu => menu.category && menu.category.value)
              .map((m) => [m.category.value, m.category])
            ).values(),
          ];
          setCategories(uniqueCats);
        }
        console.log('🔄 Using localStorage fallback for menus');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    }
  };

  // Filter menus
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchCategory =
        selectedCategory === "all" || (menu.category && menu.category.value === selectedCategory);
      const matchSearch = menu.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch && menu.is_available !== false;
    });
  }, [menus, selectedCategory, searchTerm]);

  // Save current order to localStorage
  useEffect(() => {
    localStorage.setItem("currentOrder", JSON.stringify(orderItems));
  }, [orderItems]);

  // Helper function untuk handle image path
  const getImageSrc = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:5000${imagePath}`;
    }
    return imagePath;
  };

  // Order functions
  const addToOrder = (menu, qty = 1, note = "") => {
    const exist = orderItems.find((item) => item.id === menu.id);
    if (exist) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === menu.id
            ? { ...item, quantity: item.quantity + qty, notes: note || item.notes }
            : item
        )
      );
      toast.success(`Ditambahkan ${qty}x ${menu.name} ke pesanan`);
    } else {
      setOrderItems([...orderItems, { ...menu, quantity: qty, notes: note }]);
      toast.success(`${menu.name} ditambahkan ke pesanan`);
    }
  };

  const removeFromOrder = (id) => {
    const item = orderItems.find(item => item.id === id);
    setOrderItems(orderItems.filter((item) => item.id !== id));
    toast.success(`${item?.name} dihapus dari pesanan`);
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    const item = orderItems.find(item => item.id === id);
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
    if (qty > item.quantity) {
      toast.success(`Ditambahkan ${item.name}`);
    }
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🔥 HANDLE CHECKOUT - INTEGRASI DENGAN DATABASE
  const handleCheckout = async () => {
    if (orderItems.length === 0) {
      toast.error("Pilih menu terlebih dahulu!");
      return;
    }
    if (!selectedTable) {
      toast.error("Silakan pilih meja terlebih dahulu!");
      return;
    }

    setLoading(true);

    try {
      // Siapkan data order tanpa simpan ke database
      const orderData = {
        tableId: selectedTable.id,
        tableName: selectedTable.name,
        items: orderItems.map((item) => ({
          id: item.id, // tambahkan ID menu
          nama: item.name,
          qty: item.quantity,
          harga: item.price,
          catatan: item.notes,
        })),
        totalHarga: totalPrice,
      };

      console.log('🔄 Preparing order data for checkout:', orderData);
      
      // Navigate ke checkout dengan data order
      navigate("/checkout", { 
        state: orderData 
      });
      toast.success("Pesanan berhasil disiapkan!");
      
    } catch (error) {
      console.error('❌ Error preparing order:', error);
      toast.error("Gagal memproses pesanan");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 TABLE SELECTOR COMPONENT
  const TableSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden transition-colors duration-300 border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <TableIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pilih Meja</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Silakan pilih meja untuk melanjutkan pemesanan</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {tableLoading ? (
            <div className="text-center py-8">
              <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Memuat data meja...</p>
            </div>
          ) : availableTables.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <TableIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">Tidak ada meja tersedia</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Silakan buat meja terlebih dahulu di halaman Tables</p>
              
              {/* Tombol Kembali alternatif ketika tidak ada meja */}
              <button
                onClick={() => window.location.href = '/tables'}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Pergi ke Halaman Tables
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableTables.map((table) => (
                <motion.button
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => {
                    setSelectedTable(table);
                    setShowTableSelector(false);
                    toast.success(`Meja ${table.name} dipilih`);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    table.status === "kosong"
                      ? "border-green-200 dark:border-green-600 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 hover:border-green-300 dark:hover:border-green-500 hover:shadow-lg"
                      : "border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900 opacity-60 cursor-not-allowed"
                  }`}
                  disabled={table.status !== "kosong"}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{table.name}</h3>
                    <div className={`w-3 h-3 rounded-full ${
                      table.status === "kosong" ? "bg-green-500" : "bg-red-500"
                    }`}></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Kapasitas: {table.capacity} orang
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {table.status === "kosong" ? "Tersedia" : "Terisi"}
                  </p>
                </motion.button>
              ))}
            </div>
          )}
        </div>
        
        {availableTables.filter(t => t.status === "kosong").length === 0 && availableTables.length > 0 && (
          <div className="p-6 text-center border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <Clock className="w-12 h-12 mx-auto mb-2" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tidak ada meja yang tersedia saat ini</p>
            <button
              onClick={() => window.location.href = '/tables'}
              className="mt-3 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Kelola Meja
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      {/* Table Selector Modal */}
      {showTableSelector && <TableSelector />}
      
      {/* Enhanced Header */}
      <header className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mx-auto max-w-md transition-colors duration-300 border border-gray-200 dark:border-gray-700"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Order Menu
          </h1>
          
          {/* Selected Table Display */}
          {selectedTable ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl border border-green-200 dark:border-green-600 transition-colors duration-300"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-800 dark:text-green-200 font-semibold">{selectedTable.name}</p>
                <button
                  onClick={() => setShowTableSelector(true)}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                  title="Ganti meja"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Kapasitas: {selectedTable.capacity} orang
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-xl border border-yellow-200 dark:border-yellow-600 transition-colors duration-300"
            >
              <p className="text-yellow-800 dark:text-yellow-200 font-medium flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Pilih meja untuk melanjutkan
              </p>
            </motion.div>
          )}
        </motion.div>
      </header>

      {/* Enhanced Filter & Search */}
      <div className="flex flex-col gap-4 mb-8 max-w-4xl mx-auto">
        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 transition-colors duration-300 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Kategori Menu
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <motion.button
                key={cat.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                }`}
              >
                {cat.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari menu favorit Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-0 rounded-2xl shadow-md focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </motion.div>
      </div>

      {/* Enhanced Menu List */}
      <div className="max-w-6xl mx-auto mb-96 md:mb-8">
        {filteredMenus.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tidak ada menu ditemukan
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {menus.length === 0 
                ? "Belum ada menu yang tersedia. Silakan tambahkan menu terlebih dahulu."
                : "Coba ubah pencarian atau filter kategori untuk menemukan menu yang Anda inginkan."
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenus.map((menu, index) => (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="relative">
                  <img
                    src={getImageSrc(menu.image)}
                    alt={menu.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                  <div className="absolute top-3 right-3 bg-white dark:bg-gray-700 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {menu.category?.label || 'Uncategorized'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between flex-grow">
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2 line-clamp-2">{menu.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {menu.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Rp {parseInt(menu.price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedMenu(menu);
                      setShowModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl py-3 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah ke Pesanan
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl p-6 fixed bottom-0 left-0 right-0 md:relative md:max-w-lg md:mx-auto md:rounded-3xl border-t-4 border-blue-600 z-50 transition-colors duration-300 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Ringkasan Pesanan</h2>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full px-3 py-1">
              <span className="text-white font-semibold text-sm">{orderItems.length} item</span>
            </div>
            <button
              onClick={() => setIsOrderSummaryCollapsed(!isOrderSummaryCollapsed)}
              className="w-8 h-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <svg
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-300 ${isOrderSummaryCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {!isOrderSummaryCollapsed && (
          <>
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada menu yang dipilih</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Pilih menu favorit Anda di atas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto mb-4">
                {orderItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-between items-center transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-white">{item.name}</p>
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        Rp {item.price.toLocaleString()} × {item.quantity}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic bg-yellow-50 dark:bg-yellow-900 px-2 py-1 rounded">
                          📝 {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-800 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromOrder(item.id)}
                        className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Pembayaran:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">Rp {totalPrice.toLocaleString()}</span>
          </div>
          <motion.button
            whileHover={{ scale: loading || orderItems.length === 0 ? 1 : 1.05 }}
            whileTap={{ scale: loading || orderItems.length === 0 ? 1 : 0.95 }}
            onClick={handleCheckout}
            disabled={orderItems.length === 0 || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              orderItems.length === 0 || loading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Memproses...
              </div>
            ) : orderItems.length === 0 ? (
              'Pilih Menu Terlebih Dahulu'
            ) : (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Lanjut ke Pembayaran
              </div>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {showModal && selectedMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-300 border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header with Image */}
              <div className="relative h-48">
                <img
                  src={getImageSrc(selectedMenu.image)}
                  alt={selectedMenu.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white dark:bg-gray-700 bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-opacity-100 dark:hover:bg-opacity-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedMenu.name}</h2>
                  <p className="text-white/90 font-semibold">Rp {parseInt(selectedMenu.price).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Jumlah Pesanan</label>
                  <div className="flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-l-xl text-xl transition-colors duration-200"
                    >
                      <Minus className="w-4 h-4 mx-auto" />
                    </motion.button>
                    <div className="w-20 h-12 bg-blue-50 dark:bg-blue-900 border-t border-b border-blue-200 dark:border-blue-700 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">
                      {quantity}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-r-xl text-xl transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </motion.button>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Catatan Khusus (Opsional)</label>
                  <textarea
                    placeholder="Contoh: Tidak pedas, extra sambal, dll..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows="3"
                  ></textarea>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      addToOrder(selectedMenu, quantity, notes);
                      setShowModal(false);
                      setQuantity(1);
                      setNotes("");
                    }}
                    className="flex-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah - Rp {(selectedMenu.price * quantity).toLocaleString()}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}