import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiSearch, FiMinus, FiPlus, FiShoppingCart, FiX } from "react-icons/fi";
import { decryptTableParam, getQueryParam, isValidEncryptedParam } from "../utils/encryption";

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([{ value: "all", label: "Semua Menu" }]);
  const [menus, setMenus] = useState([]);
  const [isOrderSummaryCollapsed, setIsOrderSummaryCollapsed] = useState(true);
  
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);

  useEffect(() => {
    const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
    setAvailableTables(savedTables);
    
    const encryptedTableParam = getQueryParam("table", location.search ? `${window.location.origin}${location.pathname}${location.search}` : window.location.href);
    
    if (encryptedTableParam && isValidEncryptedParam(encryptedTableParam)) {
      const decryptedTableId = decryptTableParam(encryptedTableParam);
      const foundTable = savedTables.find(table => table.id === decryptedTableId);
      
      if (foundTable) {
        setSelectedTable(foundTable);
        setShowTableSelector(false);
      } else {
        setShowTableSelector(true);
      }
    } else {
      setShowTableSelector(true);
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    const savedMenus = JSON.parse(localStorage.getItem("menus")) || [];
    setMenus(savedMenus);

    const uniqueCats = [
      { value: "all", label: "Semua Menu" },
      ...new Map(savedMenus.map((m) => [m.category.value, m.category])).values(),
    ];
    setCategories(uniqueCats);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchCategory =
        selectedCategory === "all" || menu.category.value === selectedCategory;
      const matchSearch = menu.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menus, selectedCategory, searchTerm]);

  useEffect(() => {
    localStorage.setItem("currentOrder", JSON.stringify(orderItems));
  }, [orderItems]);

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

  const handleCheckout = () => {
  if (orderItems.length === 0) return;
  if (!selectedTable) {
    alert("Silakan pilih meja terlebih dahulu!");
    return;
  }

  const orderData = {
    items: orderItems.map((item) => ({
      nama: item.name,
      qty: item.quantity,
      harga: item.price,
      catatan: item.notes,
    })),
    totalHarga: totalPrice,
    namaMeja: selectedTable.name,
    tableId: selectedTable.id,
  };

  // 🔹 Update status meja menjadi "terisi"
  const tables = JSON.parse(localStorage.getItem("tables")) || [];
  const updatedTables = tables.map((t) =>
    t.id === selectedTable.id ? { ...t, status: "terisi" } : t
  );
  localStorage.setItem("tables", JSON.stringify(updatedTables));

  // 🔹 Simpan data order
  localStorage.setItem("orderData", JSON.stringify(orderData));

  navigate("/checkout", { state: orderData });
};


  // 🔹 Table Selector Component
  const TableSelector = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Meja</h2>
          <p className="text-gray-600 text-sm">Silakan pilih meja untuk melanjutkan pemesanan</p>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
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
                    ? "border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300"
                    : "border-red-200 bg-red-50 opacity-60 cursor-not-allowed"
                }`}
                disabled={table.status !== "kosong"}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{table.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    table.status === "kosong" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                </div>
                <p className="text-xs text-gray-600">
                  {table.status === "kosong" ? "Tersedia" : "Terisi"}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        {availableTables.filter(t => t.status === "kosong").length === 0 && (
          <div className="p-6 text-center border-t border-gray-200">
            <div className="text-gray-500 mb-2">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Tidak ada meja yang tersedia saat ini</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      {/* Table Selector Modal */}
      {showTableSelector && <TableSelector />}
      
      {/* Enhanced Header */}
      <header className="mb-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 mx-auto max-w-md">
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
            <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-800 font-semibold">{selectedTable.name}</p>
                <button
                  onClick={() => setShowTableSelector(true)}
                  className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                  title="Ganti meja"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <p className="text-yellow-800 font-medium">Pilih meja untuk melanjutkan</p>
            </div>
          )}
        </div>
      </header>

      {/* Enhanced Filter & Search */}
      <div className="flex flex-col gap-4 mb-8 max-w-4xl mx-auto">
        {/* Category Pills */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Kategori Menu</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${selectedCategory === cat.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
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
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari menu favorit Anda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-0 rounded-2xl shadow-md focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-all duration-300"
          />
        </div>
      </div>

      {/* Enhanced Menu List */}
      <div className="max-w-6xl mx-auto mb-96 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenus.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col overflow-hidden"
            >
              <div className="relative">
                <img
                  src={menu.image}
                  alt={menu.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-xs font-medium text-gray-700">{menu.category.label}</span>
                </div>
              </div>
              <div className="p-5 flex flex-col justify-between flex-grow">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{menu.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">
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
      </div>

      {/* Enhanced Order Summary */}
      <div className="bg-white rounded-t-3xl shadow-2xl p-6 fixed bottom-0 left-0 right-0 md:relative md:max-w-lg md:mx-auto md:rounded-3xl border-t-4 border-blue-600 z-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Ringkasan Pesanan</h2>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full px-3 py-1">
              <span className="text-blue-600 font-semibold text-sm">{orderItems.length} item</span>
            </div>
            <button
              onClick={() => setIsOrderSummaryCollapsed(!isOrderSummaryCollapsed)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isOrderSummaryCollapsed ? 'rotate-180' : ''}`}
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
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Belum ada menu yang dipilih</p>
                <p className="text-gray-400 text-sm mt-1">Pilih menu favorit Anda di atas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 md:max-h-64 overflow-y-auto mb-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-blue-600 font-medium">
                        Rp {item.price.toLocaleString()} × {item.quantity}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic bg-yellow-50 px-2 py-1 rounded">
                          📝 {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center bg-white rounded-lg border">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromOrder(item.id)}
                        className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-700">Total Pembayaran:</span>
            <span className="text-2xl font-bold text-blue-600">Rp {totalPrice.toLocaleString()}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={orderItems.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${orderItems.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
              }`}
          >
            {orderItems.length === 0 ? 'Pilih Menu Terlebih Dahulu' : '🛒 Lanjut ke Pembayaran'}
          </button>
        </div>
      </div>

      {/* Enhanced Modal */}
      {showModal && selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
            {/* Modal Header with Image */}
            <div className="relative h-48">
              <img
                src={selectedMenu.image}
                alt={selectedMenu.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-opacity-100 transition-all duration-200"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white mb-1">{selectedMenu.name}</h2>
                <p className="text-white/90 font-semibold">Rp {parseInt(selectedMenu.price).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-6">
              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Jumlah Pesanan</label>
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-l-xl text-xl transition-colors duration-200"
                  >
                    −
                  </button>
                  <div className="w-20 h-12 bg-blue-50 border-t border-b border-blue-200 flex items-center justify-center font-bold text-xl text-blue-600">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-r-xl text-xl transition-colors duration-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Khusus (Opsional)</label>
                <textarea
                  placeholder="Contoh: Tidak pedas, extra sambal, dll..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  rows="3"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
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

      {/* Table Selector Modal */}
      {showTableSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Pilih Meja</h3>
                {selectedTable && (
                  <button
                    onClick={() => setShowTableSelector(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 mt-2">Pilih meja untuk melanjutkan pemesanan</p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              {availableTables.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Tidak ada meja tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableTables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table);
                        setShowTableSelector(false);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        table.status === 'kosong'
                          ? 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300'
                          : 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                      }`}
                      disabled={table.status !== 'kosong'}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">{table.name}</h4>
                          <p className="text-sm text-gray-600">Kapasitas: {table.capacity} orang</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            table.status === 'kosong' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            table.status === 'kosong' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {table.status === 'kosong' ? 'Tersedia' : 'Terisi'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
