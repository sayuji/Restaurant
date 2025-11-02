import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Download, 
  Calendar, 
  Clock,
  Users,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Loader
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { ordersAPI } from '../services/api';

export default function HistoryOrders() {
  const { theme } = useTheme();
  const [doneOrders, setDoneOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // 🔥 LOAD HISTORY ORDERS DARI DATABASE
  useEffect(() => {
    loadHistoryOrders();
    
    // Real-time polling setiap 10 detik
    const interval = setInterval(loadHistoryOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHistoryOrders = async () => {
    try {
      console.log('🔄 Loading history orders dari database...');
      const ordersData = await ordersAPI.getAll();
      
      // Filter hanya orders yang status completed/selesai
      const completedOrders = ordersData
        .filter(order => order.status === 'completed' || order.status === 'Selesai')
        .map(order => ({
          id: order.id,
          tableId: order.table_id,
          namaMeja: order.table_name,
          items: order.items || [],
          totalHarga: order.total_price,
          status: 'Selesai',
          createdAt: order.created_at,
          completedAt: order.updated_at || order.created_at,
          waktu: new Date(order.created_at).toLocaleTimeString("id-ID", { hour12: false }),
          tanggal: new Date(order.created_at).toLocaleDateString("id-ID"),
          paymentMethod: order.payment_method || 'cash'
        }));
      
      setDoneOrders(completedOrders);
      console.log('✅ History orders loaded:', completedOrders.length);
    } catch (error) {
      console.error('❌ Gagal memuat history orders dari database:', error);
      toast.error('Gagal memuat data riwayat pesanan');
      
      // Fallback ke localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("ordersDone")) || [];
        setDoneOrders(stored);
        console.log('🔄 Using localStorage fallback for history orders');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders
  const filteredOrders = doneOrders
    .filter(order => {
      const matchesSearch = order.namaMeja.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.tanggal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => 
                            item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.menu_name?.toLowerCase().includes(searchTerm.toLowerCase())
                          );
      
      const matchesDate = dateFilter === "all" || 
                         (dateFilter === "today" && isToday(order.tanggal)) ||
                         (dateFilter === "week" && isThisWeek(order.tanggal));
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt);
        case "oldest":
          return new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt);
        case "totalHigh":
          return b.totalHarga - a.totalHarga;
        case "totalLow":
          return a.totalHarga - b.totalHarga;
        case "table":
          return a.namaMeja.localeCompare(b.namaMeja);
        default:
          return 0;
      }
    });

  // Helper functions for date filtering
  const isToday = (dateString) => {
    const today = new Date().toLocaleDateString("id-ID");
    return dateString === today;
  };

  const isThisWeek = (dateString) => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const orderDate = new Date(dateString.split('/').reverse().join('-'));
    return orderDate >= startOfWeek;
  };

  // 🔥 DELETE ORDER DARI DATABASE
  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus riwayat pesanan ini?")) return;
    
    setDeleting(true);
    try {
      console.log('🗑️ Deleting order from database:', id);
      await ordersAPI.delete(id);
      
      // Update local state
      const updated = doneOrders.filter((o) => o.id !== id);
      setDoneOrders(updated);
      
      toast.success("✅ Riwayat pesanan dihapus");
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      toast.error('Gagal menghapus pesanan');
      
      // Fallback ke localStorage
      const updated = doneOrders.filter((o) => o.id !== id);
      localStorage.setItem("ordersDone", JSON.stringify(updated));
      setDoneOrders(updated);
    } finally {
      setDeleting(false);
    }
  };

  // 🔥 BULK DELETE ORDERS DARI DATABASE
  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    
    if (!window.confirm(`Yakin hapus ${selectedOrders.size} riwayat pesanan?`)) return;
    
    setDeleting(true);
    try {
      console.log('🗑️ Bulk deleting orders from database:', Array.from(selectedOrders));
      
      // Delete each order from database
      const deletePromises = Array.from(selectedOrders).map(id => 
        ordersAPI.delete(id).catch(err => {
          console.error(`Failed to delete order ${id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      const updated = doneOrders.filter((o) => !selectedOrders.has(o.id));
      setDoneOrders(updated);
      setSelectedOrders(new Set());
      setShowBulkActions(false);
      
      toast.success(`✅ ${selectedOrders.size} riwayat pesanan dihapus`);
    } catch (error) {
      console.error('❌ Error in bulk delete:', error);
      toast.error('Gagal menghapus beberapa pesanan');
      
      // Fallback ke localStorage
      const updated = doneOrders.filter((o) => !selectedOrders.has(o.id));
      localStorage.setItem("ordersDone", JSON.stringify(updated));
      setDoneOrders(updated);
      setSelectedOrders(new Set());
      setShowBulkActions(false);
    } finally {
      setDeleting(false);
    }
  };

  const toggleOrderSelection = (id) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
      setShowBulkActions(true);
    }
  };

  const exportToCSV = () => {
    const headers = ["Meja", "Tanggal", "Waktu", "Total", "Status", "Metode Pembayaran", "Items"];
    const csvData = filteredOrders.map(order => [
      order.namaMeja,
      order.tanggal,
      order.waktu,
      order.totalHarga,
      order.status,
      order.paymentMethod === "qris" ? "QRIS" : "Tunai",
      order.items.map(item => `${item.nama || item.menu_name} (${item.qty || item.quantity}x)`).join("; ")
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat-pesanan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("📊 Data berhasil diexport ke CSV");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getTotalRevenue = () => {
    return filteredOrders.reduce((sum, order) => sum + order.totalHarga, 0);
  };

  const getOrdersCountByDate = () => {
    const countByDate = {};
    filteredOrders.forEach(order => {
      countByDate[order.tanggal] = (countByDate[order.tanggal] || 0) + 1;
    });
    return countByDate;
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}>
        <div className="text-center">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className={`text-lg ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Memuat riwayat pesanan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900" : "bg-gray-50"
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
              📜 Riwayat Pesanan Selesai
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Lacak semua pesanan yang telah diselesaikan
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 lg:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {filteredOrders.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pesanan</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(getTotalRevenue())}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-6 transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800 shadow-lg" : "bg-white shadow-lg"
        }`}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan meja, tanggal, atau menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="totalHigh">Total Tertinggi</option>
              <option value="totalLow">Total Terendah</option>
              <option value="table">Nama Meja</option>
            </select>

            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
            >
              <div className="flex items-center justify-between">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {selectedOrders.size} pesanan terpilih
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Hapus yang Dipilih
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrders(new Set());
                      setShowBulkActions(false);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl p-12 text-center transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800 shadow-lg" : "bg-white shadow-lg"
          }`}
        >
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Tidak ada riwayat pesanan
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {doneOrders.length === 0 
              ? "Belum ada pesanan yang diselesaikan" 
              : "Tidak ada pesanan yang sesuai dengan filter"
            }
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl overflow-hidden transition-colors duration-300 ${
            theme === "dark" ? "bg-gray-800 shadow-lg" : "bg-white shadow-lg"
          }`}
        >
          {/* Table Header */}
          <div className={`p-4 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={selectAllOrders}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pilih Semua
              </span>
            </div>
          </div>

          {/* Orders */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-6 transition-colors duration-200 ${
                    selectedOrders.has(order.id)
                      ? theme === "dark" 
                        ? "bg-blue-900/20" 
                        : "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    {/* Order Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {order.namaMeja}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {order.paymentMethod === "qris" ? "QRIS" : "Tunai"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{order.tanggal}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{order.waktu}</span>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(order.totalHarga)}
                        </p>
                        <p className="text-sm text-green-500 dark:text-green-400">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={deleting}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Hapus"
                      >
                        {deleting ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pl-14"
                      >
                        <div className={`p-4 rounded-xl ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        }`}>
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                            Items Pesanan:
                          </h4>
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium text-gray-800 dark:text-white">
                                    {item.nama || item.menu_name} × {item.qty || item.quantity}
                                  </span>
                                  {(item.catatan || item.notes) && (
                                    <span className="text-gray-500 dark:text-gray-400 italic ml-2">
                                      ({item.catatan || item.notes})
                                    </span>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white">
                                  {formatCurrency((item.harga || item.price) * (item.qty || item.quantity))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
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
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Detail Pesanan Lengkap
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Meja: {selectedOrder.namaMeja}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                      Informasi Pesanan
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tanggal:</span>
                        <span className="font-medium">{selectedOrder.tanggal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Waktu:</span>
                        <span className="font-medium">{selectedOrder.waktu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pembayaran:</span>
                        <span className="font-medium">
                          {selectedOrder.paymentMethod === "qris" ? "QRIS" : "Tunai"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                      Ringkasan
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                        <span className="font-medium">{selectedOrder.items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedOrder.totalHarga)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                        <span>Total:</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(selectedOrder.totalHarga)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                    Daftar Items
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-white">
                              {item.nama || item.menu_name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Qty: {item.qty || item.quantity}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                @ {formatCurrency(item.harga || item.price)}
                              </span>
                            </div>
                            {(item.catatan || item.notes) && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                📝 {item.catatan || item.notes}
                              </p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {formatCurrency((item.harga || item.price) * (item.qty || item.quantity))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors duration-200 ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}