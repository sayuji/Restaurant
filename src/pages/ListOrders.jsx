import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  X,
  Plus,
  Minus,
  FileText,
  ChefHat
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { theme } = useTheme();

  useEffect(() => {
    const fetchOrders = () => {
      const stored = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
      setOrders(stored);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // Real-time update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.namaMeja.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => 
                            item.nama.toLowerCase().includes(searchTerm.toLowerCase())
                          );
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.id || b.createdAt) - new Date(a.id || a.createdAt);
        case "oldest":
          return new Date(a.id || a.createdAt) - new Date(b.id || b.createdAt);
        case "table":
          return a.namaMeja.localeCompare(b.namaMeja);
        case "total":
          return b.totalHarga - a.totalHarga;
        default:
          return 0;
      }
    });

  const handleSave = (updatedOrder) => {
    const updatedOrders = orders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order
    );

    localStorage.setItem("ordersOnProgress", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    setShowModal(false);
    toast.success("✅ Perubahan pesanan berhasil disimpan");
  };

  const handleComplete = (order) => {
    setConfirmOrder(order);
  };

  const confirmComplete = () => {
    if (!confirmOrder) return;

    const remainingOrders = orders.filter((o) => o.id !== confirmOrder.id);
    const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];

    const now = new Date();
    const completedOrder = {
      ...confirmOrder,
      status: "Selesai",
      completedAt: now.toISOString(),
      waktu: now.toLocaleTimeString("id-ID", { hour12: false }),
      tanggal: now.toLocaleDateString("id-ID"),
    };

    localStorage.setItem("ordersOnProgress", JSON.stringify(remainingOrders));
    localStorage.setItem(
      "ordersDone",
      JSON.stringify([...doneOrders, completedOrder])
    );
    setOrders(remainingOrders);

    // Update table status
    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const updatedTables = tables.map((table) =>
      table.id === confirmOrder.tableId
        ? { ...table, status: "kosong", currentOrder: null }
        : table
    );
    localStorage.setItem("tables", JSON.stringify(updatedTables));

    toast.success(`🎉 Pesanan ${confirmOrder.namaMeja} selesai & meja dikosongkan`);
    setConfirmOrder(null);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(JSON.parse(JSON.stringify(order)));
    setShowModal(true);
  };

  const updateItemQty = (index, newQty) => {
    if (newQty < 1) return;
    const updated = { ...selectedOrder };
    updated.items[index].qty = newQty;
    
    // Recalculate total
    updated.totalHarga = updated.items.reduce(
      (sum, item) => sum + (item.harga * item.qty), 
      0
    );
    
    setSelectedOrder(updated);
  };

  const updateItemNote = (index, newNote) => {
    const updated = { ...selectedOrder };
    updated.items[index].catatan = newNote;
    setSelectedOrder(updated);
  };

  const removeItem = (index) => {
    const updated = { ...selectedOrder };
    updated.items.splice(index, 1);
    
    // Recalculate total
    updated.totalHarga = updated.items.reduce(
      (sum, item) => sum + (item.harga * item.qty), 
      0
    );
    
    setSelectedOrder(updated);
  };

  const getStatusColor = (status) => {
    const colors = {
      "Sedang Diproses": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "Siap Disajikan": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Menunggu Pembayaran": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "Selesai": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    };
    return colors[status] || colors["Sedang Diproses"];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getOrderDuration = (order) => {
    const created = new Date(order.id || order.createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} menit`;
  };

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      theme === "light" ? "bg-gray-50" : "bg-gray-900"
    }`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              👨‍🍳 Daftar Pesanan Aktif
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola pesanan yang sedang berlangsung di restoran
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 lg:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {orders.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pesanan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter(o => o.status === "Siap Disajikan").length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Siap Disajikan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-6 transition-colors duration-300 ${
          theme === "light" ? "bg-white shadow-lg" : "bg-gray-800 shadow-lg"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari pesanan berdasarkan meja atau menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "light"
                  ? "bg-white border-gray-300 text-gray-800"
                  : "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "light"
                  ? "bg-white border-gray-300 text-gray-800"
                  : "bg-gray-700 border-gray-600 text-white"
              }`}
            >
              <option value="all">Semua Status</option>
              <option value="Sedang Diproses">Sedang Diproses</option>
              <option value="Siap Disajikan">Siap Disajikan</option>
              <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "light"
                  ? "bg-white border-gray-300 text-gray-800"
                  : "bg-gray-700 border-gray-600 text-white"
              }`}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="table">Nama Meja</option>
              <option value="total">Total Tertinggi</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl p-12 text-center transition-colors duration-300 ${
            theme === "light" ? "bg-white shadow-lg" : "bg-gray-800 shadow-lg"
          }`}
        >
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Tidak ada pesanan aktif
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {orders.length === 0 
              ? "Semua pesanan sudah selesai diproses" 
              : "Tidak ada pesanan yang sesuai dengan filter"
            }
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${
                  theme === "light" 
                    ? "bg-white shadow-lg border border-gray-200" 
                    : "bg-gray-800 shadow-lg border border-gray-700"
                }`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {order.namaMeja}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.tanggal} • {order.waktu}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Order Duration */}
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Berjalan: {getOrderDuration(order)}</span>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.nama} × {item.qty}
                        </p>
                        {item.catatan && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            📝 {item.catatan}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-white ml-4">
                        {formatCurrency(item.harga * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(order.totalHarga)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(order)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleComplete(order)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Selesai
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Order Modal */}
      <AnimatePresence>
        {showModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors duration-300 ${
                theme === "light" ? "bg-white" : "bg-gray-800"
              }`}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Edit Pesanan
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Meja: {selectedOrder.namaMeja}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {selectedOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl transition-colors duration-200 ${
                        theme === "light" ? "bg-gray-50" : "bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {item.nama}
                        </h4>
                        <button
                          onClick={() => removeItem(i)}
                          className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Quantity Control */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Jumlah
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateItemQty(i, item.qty - 1)}
                              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItemQty(i, parseInt(e.target.value) || 1)}
                              className={`w-16 text-center rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${
                                theme === "light"
                                  ? "border-gray-300 bg-white"
                                  : "border-gray-600 bg-gray-800 text-white"
                              }`}
                            />
                            <button
                              onClick={() => updateItemQty(i, item.qty + 1)}
                              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Catatan
                          </label>
                          <input
                            type="text"
                            value={item.catatan || ""}
                            onChange={(e) => updateItemNote(i, e.target.value)}
                            placeholder="Tambah catatan..."
                            className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                              theme === "light"
                                ? "border-gray-300 bg-white"
                                : "border-gray-600 bg-gray-800 text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-right">
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {formatCurrency(item.harga * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Updated Total */}
                <div className={`mt-6 p-4 rounded-xl ${
                  theme === "light" ? "bg-blue-50" : "bg-blue-900/20"
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      Total Baru:
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedOrder.totalHarga)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors duration-200 ${
                    theme === "light"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleSave(selectedOrder)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl p-6 w-full max-w-md text-center transition-colors duration-300 ${
                theme === "light" ? "bg-white" : "bg-gray-800"
              }`}
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Selesaikan Pesanan?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Konfirmasi penyelesaian pesanan untuk meja{" "}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {confirmOrder.namaMeja}
                </span>
                . Meja akan dikosongkan setelah konfirmasi.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOrder(null)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors duration-200 ${
                    theme === "light"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200"
                >
                  Ya, Selesaikan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}