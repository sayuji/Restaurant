import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch, FiMinus, FiPlus, FiShoppingCart, FiX } from "react-icons/fi";
import { decryptTableParam, getQueryParam, isValidEncryptedParam } from "../utils/encryption";
import { useTheme } from "../context/ThemeContext";
import { menuAPI, ordersAPI, tablesAPI } from '../services/api';

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
      console.log('🔄 Loading tables dari database...');
      const tablesData = await tablesAPI.getAll();
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
      // Fallback ke localStorage
      try {
        const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
        setAvailableTables(savedTables);
        console.log('🔄 Using localStorage fallback for tables');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
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
      
    } catch (error) {
      console.error('❌ Gagal memuat menu dari backend:', error);
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
    } else {
      setOrderItems([...orderItems, { ...menu, quantity: qty, notes: note }]);
    }
  };

  const removeFromOrder = (id) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🔥 HANDLE CHECKOUT - INTEGRASI DENGAN DATABASE
  const handleCheckout = async () => {
    if (orderItems.length === 0) return;
    if (!selectedTable) {
      alert("Silakan pilih meja terlebih dahulu!");
      return;
    }

    if (loading) return;
    setLoading(true);

    const orderData = {
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      items: orderItems.map((item) => ({
        nama: item.name,
        qty: item.quantity,
        harga: item.price,
        catatan: item.notes,
      })),
      totalHarga: totalPrice,
    };

    try {
      console.log('🔄 Creating order in database...', orderData);
      
      // ✅ CREATE ORDER DI DATABASE - SAMA PATTERN DENGAN MENU.JSX
      const response = await ordersAPI.create(orderData);
      
      if (response.success) {
        console.log('✅ Order created successfully:', response.orderId);
        
        // ✅ UPDATE TABLE STATUS DI DATABASE
        await tablesAPI.updateStatus(selectedTable.id, 'terisi');
        console.log('✅ Table status updated to "terisi"');
        
        // Update local state
        const updatedTables = availableTables.map((t) =>
          t.id === selectedTable.id ? { ...t, status: "terisi" } : t
        );
        setAvailableTables(updatedTables);
        
        // Save to localStorage sebagai backup
        localStorage.setItem("tables", JSON.stringify(updatedTables));
        
        // Navigate ke checkout dengan data order
        navigate("/checkout", { 
          state: { 
            ...orderData, 
            orderId: response.orderId 
          } 
        });
      }
    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert('Gagal membuat order. Silakan coba lagi.');
      
      // Fallback: save to localStorage
      console.log('🔄 Using localStorage fallback for order...');
      const tables = JSON.parse(localStorage.getItem("tables")) || [];
      const updatedTables = tables.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "terisi" } : t
      );
      localStorage.setItem("tables", JSON.stringify(updatedTables));
      localStorage.setItem("orderData", JSON.stringify(orderData));
      
      navigate("/checkout", { state: orderData });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 TABLE SELECTOR COMPONENT
  const TableSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Pilih Meja</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Silakan pilih meja untuk melanjutkan pemesanan</p>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {availableTables.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400">Tidak ada meja tersedia</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Silakan buat meja terlebih dahulu di halaman Tables</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => {
                    setSelectedTable(table);
                    setShowTableSelector(false);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    table.status === "kosong"
                      ? "border-green-200 dark:border-green-600 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 hover:border-green-300 dark:hover:border-green-500"
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
                </button>
              ))}
            </div>
          )}
        </div>
        
        {availableTables.filter(t => t.status === "kosong").length === 0 && availableTables.length > 0 && (
          <div className="p-6 text-center border-t border-gray-200 dark:border-gray-700">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tidak ada meja yang tersedia saat ini</p>
          </div>
        )}
      </div>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mx-auto max-w-md transition-colors duration-300">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Order Menu
          </h1>
          
          {/* Selected Table Display */}
          {selectedTable ? (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl border border-green-200 dark:border-green-600 transition-colors duration-300">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-800 dark:text-green-200 font-semibold">{selectedTable.name}</p>
                <button
                  onClick={() => setShowTableSelector(true)}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                  title="Ganti meja"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Kapasitas: {selectedTable.capacity} orang
              </p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-xl border border-yellow-200 dark:border-yellow-600 transition-colors duration-300">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">Pilih meja untuk melanjutkan</p>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Filter & Search */}
      <div className="flex flex-col gap-4 mb-8 max-w-4xl mx-auto">
        {/* Category Pills */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 transition-colors duration-300">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Kategori Menu</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari menu favorit Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-0 rounded-2xl shadow-md focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-300 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Enhanced Menu List */}
      <div className="max-w-6xl mx-auto mb-96 md:mb-8">
        {filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
              <FiShoppingCart className="w-12 h-12 text-gray-400 dark:text-gray-600" />
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
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenus.map((menu) => (
              <div
                key={menu.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden"
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
                  <button
                    onClick={() => {
                      setSelectedMenu(menu);
                      setShowModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    + Tambah ke Pesanan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Order Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl p-6 fixed bottom-0 left-0 right-0 md:relative md:max-w-lg md:mx-auto md:rounded-3xl border-t-4 border-blue-600 z-50 transition-colors duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Ringkasan Pesanan</h2>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-full px-3 py-1">
              <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">{orderItems.length} item</span>
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
                  <FiShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada menu yang dipilih</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Pilih menu favorit Anda di atas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto mb-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-between items-center transition-colors duration-300">
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
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-800 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r-lg transition-colors"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromOrder(item.id)}
                        className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200 flex items-center justify-center"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
          <button
            onClick={handleCheckout}
            disabled={orderItems.length === 0 || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              orderItems.length === 0 || loading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? '🔄 Memproses...' : orderItems.length === 0 ? 'Pilih Menu Terlebih Dahulu' : '🛒 Lanjut ke Pembayaran'}
          </button>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showModal && selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden transition-colors duration-300">
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
                <FiX className="w-5 h-5" />
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
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-l-xl text-xl transition-colors duration-200"
                  >
                    <FiMinus className="w-4 h-4 mx-auto" />
                  </button>
                  <div className="w-20 h-12 bg-blue-50 dark:bg-blue-900 border-t border-b border-blue-200 dark:border-blue-700 flex items-center justify-center font-bold text-xl text-blue-600 dark:text-blue-400">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-r-xl text-xl transition-colors duration-200"
                  >
                    <FiPlus className="w-4 h-4 mx-auto" />
                  </button>
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
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    addToOrder(selectedMenu, quantity, notes);
                    setShowModal(false);
                    setQuantity(1);
                    setNotes("");
                  }}
                  className="flex-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Tambah ke Pesanan - Rp {(selectedMenu.price * quantity).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}