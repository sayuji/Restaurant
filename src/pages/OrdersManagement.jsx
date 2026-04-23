import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Edit3, CheckCircle, Clock, Users, X, Plus, Minus,
  ChefHat, Loader, Package, History, Trash2, Eye, Download,
  Calendar, FileText, ChevronDown, ChevronUp, Receipt, Printer,
  CreditCard, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { ordersAPI, tablesAPI, getCurrentUser } from '../services/api';

export default function OrdersManagement() {
  const [activeTab, setActiveTab] = useState("active"); // "active", "history", or "receipts"
  const [orders, setOrders] = useState([]);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const { theme } = useTheme();
  const user = getCurrentUser();
  const canCompleteOrder = ['admin', 'manager', 'cashier'].includes(user?.role);

  // Restaurant settings for receipts
  const [settings, setSettings] = useState({
    restaurantName: "RestoMaster Pro",
    restaurantPhone: "+62 812-3456-7890",
    restaurantAddress: "Jl. Restoran No. 123, Jakarta",
    taxRate: 10,
    serviceCharge: 5,
    currency: "IDR",
    receiptHeader: "Terima kasih telah berkunjung!",
    receiptFooter: "Silakan datang kembali!"
  });

  useEffect(() => {
    loadOrders();
    loadSettings();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem("restaurantSettings")) || {};
    setSettings(prev => ({ ...prev, ...savedSettings }));
  };

  const loadOrders = async () => {
    try {
      const ordersData = await ordersAPI.getAll();
      
      // Active orders
      const activeOrders = ordersData
        .filter(order => order.status !== 'completed')
        .map(transformOrder);
      
      // History orders
      const completedOrders = ordersData
        .filter(order => order.status === 'completed')
        .map(transformOrder);
      
      setOrders(activeOrders);
      setHistoryOrders(completedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const transformOrder = (order) => {
    let fixedItems = [];
    try {
      if (typeof order.items === 'string') {
        fixedItems = JSON.parse(order.items);
      } else {
        fixedItems = order.items || [];
      }
      
      fixedItems = fixedItems.map(item => ({
        id: item.id,
        nama: item.name || item.nama,
        qty: item.qty || item.quantity,
        harga: item.harga || item.price,
        catatan: item.catatan || item.notes
      }));
    } catch (error) {
      console.error('Error parsing items:', error);
      fixedItems = [];
    }
    
    return {
      id: order.id,
      tableId: order.table_id,
      namaMeja: order.table_name,
      items: fixedItems,
      totalHarga: order.total_price,
      status: order.status === 'completed' ? 'Selesai' : 'Sedang Diproses',
      createdAt: order.created_at,
      completedAt: order.updated_at || order.created_at,
      waktu: new Date(order.created_at).toLocaleTimeString("id-ID", { hour12: false }),
      tanggal: new Date(order.created_at).toLocaleDateString("id-ID"),
      paymentMethod: order.payment_method || 'cash'
    };
  };

  const handleSave = async (updatedOrder) => {
    setUpdating(true);
    try {
      const orderPayload = {
        tableId: updatedOrder.tableId,
        tableName: updatedOrder.namaMeja,
        items: updatedOrder.items.map(item => ({
          nama: item.nama,
          qty: item.qty,
          harga: item.harga,
          catatan: item.catatan
        })),
        totalHarga: updatedOrder.totalHarga,
        status: 'processing'
      };

      await ordersAPI.update(updatedOrder.id, orderPayload);
      await loadOrders();
      setShowEditModal(false);
      toast.success("Perubahan pesanan berhasil disimpan");
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = (order) => {
    setConfirmOrder(order);
  };

  const confirmComplete = async () => {
    if (!confirmOrder) return;
    
    setUpdating(true);
    try {
      await ordersAPI.updateStatus(confirmOrder.id, 'completed');
      await tablesAPI.updateStatus(confirmOrder.tableId, 'kosong');
      await loadOrders();
      toast.success(`Pesanan ${confirmOrder.namaMeja} selesai!`);
      setConfirmOrder(null);
    } catch (error) {
      console.error('Error completing order:', error);
      toast.error('Gagal menyelesaikan pesanan');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await ordersAPI.delete(id);
      await loadOrders();
      toast.success("Riwayat pesanan dihapus");
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Gagal menghapus pesanan');
    } finally {
      setDeleting(false);
      setOrderToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    
    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedOrders).map(id => 
        ordersAPI.delete(id).catch(err => console.error(`Failed to delete order ${id}:`, err))
      );
      
      await Promise.all(deletePromises);
      await loadOrders();
      setSelectedOrders(new Set());
      setShowBulkActions(false);
      toast.success(`${selectedOrders.size} riwayat pesanan dihapus`);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Gagal menghapus beberapa pesanan');
    } finally {
      setDeleting(false);
    }
  };

  const updateItemQty = (index, newQty) => {
    if (newQty < 1) return;
    const updated = { ...selectedOrder };
    updated.items[index].qty = newQty;
    updated.totalHarga = updated.items.reduce((sum, item) => sum + (item.harga * item.qty), 0);
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
    updated.totalHarga = updated.items.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    setSelectedOrder(updated);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getOrderDuration = (order) => {
    const created = new Date(order.createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins} menit`;
  };

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
      order.items.map(item => `${item.nama} (${item.qty}x)`).join("; ")
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pesanan-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diexport ke CSV");
  };

  const currentOrders = activeTab === "active" ? orders : activeTab === "history" ? historyOrders : historyOrders;

  const filteredOrders = currentOrders
    .filter(order => {
      const matchesSearch = order.namaMeja.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.tanggal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.nama?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDate = activeTab === "active" || dateFilter === "all" || 
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
        case "table":
          return a.namaMeja.localeCompare(b.namaMeja);
        case "total":
          return b.totalHarga - a.totalHarga;
        default:
          return 0;
      }
    });

  const getTotalRevenue = () => {
    return filteredOrders.reduce((sum, order) => sum + order.totalHarga, 0);
  };

  // Receipt functions
  const getOrderItems = (order) => {
    if (!order.items) return [];
    
    return order.items.map(item => ({
      name: item.nama || item.menu_name || item.name,
      quantity: item.qty || item.quantity,
      price: item.harga || item.price,
      notes: item.catatan || item.notes
    }));
  };

  const calculateReceiptTotals = (order) => {
    const items = getOrderItems(order);
    const subtotal = order.totalHarga || order.total_price || 
                    items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = (subtotal * settings.taxRate) / 100;
    const serviceCharge = (subtotal * settings.serviceCharge) / 100;
    const total = subtotal + tax + serviceCharge;
    return { subtotal, tax, serviceCharge, total, items };
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    
    const isDarkMode = theme === "dark";
    const backgroundColor = isDarkMode ? "#1f2937" : "#ffffff";
    const textColor = isDarkMode ? "#f3f4f6" : "#111827";
    const borderColor = isDarkMode ? "#4b5563" : "#d1d5db";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${settings.restaurantName}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 0; 
            padding: 10px;
            max-width: 300px;
            background: ${backgroundColor};
            color: ${textColor};
          }
          .receipt { 
            border: 1px dashed ${borderColor}; 
            padding: 15px; 
            background: ${backgroundColor};
          }
          .header { text-align: center; margin-bottom: 10px; }
          .restaurant-name { font-weight: bold; font-size: 14px; color: ${textColor}; }
          .divider { border-top: 1px dashed ${borderColor}; margin: 10px 0; }
          .items { width: 100%; border-collapse: collapse; }
          .items td { padding: 2px 0; color: ${textColor}; }
          .items .qty { width: 20px; text-align: center; }
          .items .name { padding-left: 5px; }
          .items .price { text-align: right; }
          .totals { width: 100%; margin-top: 10px; }
          .totals td { padding: 2px 0; color: ${textColor}; }
          .totals .label { text-align: left; }
          .totals .amount { text-align: right; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: ${textColor}; }
          .thank-you { font-weight: bold; margin: 10px 0; }
          .total-amount { color: #10b981; font-weight: bold; }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${receiptContent.innerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    toast.success("Struk berhasil diprint");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Memuat data pesanan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Manajemen Pesanan
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola pesanan aktif dan riwayat pesanan
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pesanan</p>
            </div>
            {activeTab === "history" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(getTotalRevenue())}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 inline-flex gap-2 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setActiveTab("active");
              setSelectedOrders(new Set());
              setShowBulkActions(false);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "active"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Package className="w-5 h-5" />
            Pesanan Aktif
            {orders.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "active" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
              }`}>
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              setSelectedOrders(new Set());
              setShowBulkActions(false);
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === "history"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <History className="w-5 h-5" />
            Riwayat Pesanan
            {historyOrders.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === "history" ? "bg-white text-blue-600" : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
              }`}>
                {historyOrders.length}
              </span>
            )}
          </button>

        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari pesanan berdasarkan meja atau menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {activeTab === "history" && (
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="all">Semua Tanggal</option>
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="table">Nama Meja</option>
              <option value="total">Total Tertinggi</option>
            </select>

            {activeTab === "history" && (
              <motion.button
                onClick={exportToCSV}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            )}
          </div>
        </div>

        {/* Bulk Actions for History */}
        {activeTab === "history" && showBulkActions && (
          <AnimatePresence>
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
                  <motion.button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    whileHover={{ scale: deleting ? 1 : 1.02 }}
                    whileTap={{ scale: deleting ? 1 : 0.98 }}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Hapus yang Dipilih
                  </motion.button>
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
          </AnimatePresence>
        )}
      </motion.div>

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl shadow-lg p-12 text-center transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          {activeTab === "active" ? <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" /> : 
           <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {activeTab === "active" ? "Tidak ada pesanan aktif" : 
             "Tidak ada riwayat pesanan"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {currentOrders.length === 0 
              ? (activeTab === "active" ? "Semua pesanan sudah selesai diproses" : 
                 "Belum ada pesanan yang diselesaikan")
              : "Tidak ada pesanan yang sesuai dengan pencarian"
            }
          </p>
        </motion.div>
      ) : activeTab === "active" ? (
        // Active Orders Grid View
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">{order.namaMeja}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{order.tanggal} • {order.waktu}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                    Sedang Diproses
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Berjalan: {getOrderDuration(order)}</span>
                </div>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.nama} × {item.qty}
                        </p>
                        {item.catatan && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">📝 {item.catatan}</p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-white ml-4">
                        {formatCurrency(item.harga * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">Total:</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(order.totalHarga)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    onClick={() => {
                      setSelectedOrder(JSON.parse(JSON.stringify(order)));
                      setShowEditModal(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleViewReceipt(order)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Receipt className="w-4 h-4" />
                    Struk
                  </motion.button>
                  {canCompleteOrder && (
                    <motion.button
                      onClick={() => handleComplete(order)}
                      disabled={updating}
                      whileHover={{ scale: updating ? 1 : 1.02 }}
                      whileTap={{ scale: updating ? 1 : 0.98 }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Selesaikan
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : activeTab === "history" ? (
        // History Orders List View
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={selectAllOrders}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Pilih Semua</span>
            </div>
          </div>

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
                    selectedOrders.has(order.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleOrderSelection(order.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">{order.namaMeja}</p>
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
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(order.totalHarga)}
                        </p>
                        <p className="text-sm text-green-500 dark:text-green-400">{order.items.length} items</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Lihat Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewReceipt(order)}
                        className="p-2 text-purple-600 hover:text-purple-700 transition-colors"
                        title="Lihat Struk"
                      >
                        <Receipt className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setOrderToDelete(order)}
                        disabled={deleting}
                        className="p-2 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Hapus"
                      >
                        {deleting ? <Loader className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedOrder === order.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pl-14"
                      >
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Items Pesanan:</h4>
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium text-gray-800 dark:text-white">
                                    {item.nama} × {item.qty}
                                  </span>
                                  {item.catatan && (
                                    <span className="text-gray-500 dark:text-gray-400 italic ml-2">({item.catatan})</span>
                                  )}
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white">
                                  {formatCurrency(item.harga * item.qty)}
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
      ) : null}

      {/* Edit Order Modal */}
      <AnimatePresence>
        {showEditModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Pesanan</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Meja: {selectedOrder.namaMeja}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white">{item.nama}</h4>
                        <button
                          onClick={() => removeItem(i)}
                          className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah</label>
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
                              className="w-16 text-center rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                            />
                            <button
                              onClick={() => updateItemQty(i, item.qty + 1)}
                              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan</label>
                          <input
                            type="text"
                            value={item.catatan || ""}
                            onChange={(e) => updateItemNote(i, e.target.value)}
                            placeholder="Tambah catatan..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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

                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">Total Baru:</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(selectedOrder.totalHarga)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <motion.button
                  onClick={() => setShowEditModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={() => handleSave(selectedOrder)}
                  disabled={updating}
                  whileHover={{ scale: updating ? 1 : 1.02 }}
                  whileTap={{ scale: updating ? 1 : 0.98 }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {updating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal for History */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">Detail Pesanan Lengkap</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Meja: {selectedOrder.namaMeja}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Informasi Pesanan</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tanggal:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{selectedOrder.tanggal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Waktu:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{selectedOrder.waktu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{selectedOrder.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Pembayaran:</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {selectedOrder.paymentMethod === "qris" ? "QRIS" : "Tunai"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Ringkasan</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{selectedOrder.items.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {formatCurrency(selectedOrder.totalHarga)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                        <span className="text-gray-800 dark:text-white">Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatCurrency(selectedOrder.totalHarga)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Items Pesanan</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-white">{item.nama}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatCurrency(item.harga)} × {item.qty}
                            </p>
                            {item.catatan && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">📝 {item.catatan}</p>
                            )}
                          </div>
                          <p className="font-bold text-gray-800 dark:text-white">
                            {formatCurrency(item.harga * item.qty)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={() => setShowDetailModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Complete Modal */}
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
              className="rounded-2xl p-6 w-full max-w-md text-center transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                <motion.button
                  onClick={() => setConfirmOrder(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={confirmComplete}
                  disabled={updating}
                  whileHover={{ scale: updating ? 1 : 1.02 }}
                  whileTap={{ scale: updating ? 1 : 0.98 }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {updating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Ya, Selesaikan'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
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
              className="rounded-2xl p-6 w-full max-w-md text-center transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Hapus Riwayat Pesanan?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Apakah Anda yakin ingin menghapus riwayat pesanan untuk meja{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {orderToDelete.namaMeja}
                </span>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => setOrderToDelete(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Batal
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(orderToDelete.id)}
                  disabled={deleting}
                  whileHover={{ scale: deleting ? 1 : 1.02 }}
                  whileTap={{ scale: deleting ? 1 : 0.98 }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {deleting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Ya, Hapus'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        Struk Order #{selectedOrder.id}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div id="receipt-content" className={`p-6 rounded-xl border-2 border-dashed ${
                  theme === "dark" ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300"
                }`}>
                  <div className="text-center mb-4">
                    <div className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {settings.restaurantName}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      {settings.restaurantAddress}
                    </div>
                    <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      {settings.restaurantPhone}
                    </div>
                    <div className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {settings.receiptHeader}
                    </div>
                  </div>

                  <div className={`border-t border-dashed ${theme === "dark" ? "border-gray-500" : "border-gray-400"} my-3`}></div>

                  <div className="flex justify-between text-sm mb-4">
                    <div>
                      <div className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        Order: <strong className={theme === "dark" ? "text-white" : "text-gray-900"}>#{selectedOrder.id}</strong>
                      </div>
                      <div className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        Meja: <strong className={theme === "dark" ? "text-white" : "text-gray-900"}>{selectedOrder.namaMeja}</strong>
                      </div>
                    </div>
                    <div className={`text-right ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      <div>Tanggal: {new Date(selectedOrder.createdAt).toLocaleDateString('id-ID')}</div>
                      <div>Waktu: {new Date(selectedOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div className={`border-t border-dashed ${theme === "dark" ? "border-gray-500" : "border-gray-400"} my-3`}></div>

                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className={`border-b ${theme === "dark" ? "border-gray-600" : "border-gray-300"}`}>
                        <th className={`text-left pb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Item</th>
                        <th className={`text-center pb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Qty</th>
                        <th className={`text-right pb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const { items } = calculateReceiptTotals(selectedOrder);
                        return items.map((item, index) => (
                          <tr key={index} className={`border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            <td className="py-2">
                              <div className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{item.name}</div>
                              {item.notes && (
                                <div className={`text-xs italic ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                  Note: {item.notes}
                                </div>
                              )}
                              <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                {formatCurrency(item.price)}
                              </div>
                            </td>
                            <td className={`text-center py-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                              x{item.quantity}
                            </td>
                            <td className={`text-right py-2 font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>

                  <div className={`border-t border-dashed ${theme === "dark" ? "border-gray-500" : "border-gray-400"} my-3`}></div>

                  {(() => {
                    const { subtotal, tax, serviceCharge, total } = calculateReceiptTotals(selectedOrder);
                    return (
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className={`py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Subtotal:</td>
                            <td className={`text-right py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{formatCurrency(subtotal)}</td>
                          </tr>
                          <tr>
                            <td className={`py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Pajak ({settings.taxRate}%):</td>
                            <td className={`text-right py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{formatCurrency(tax)}</td>
                          </tr>
                          <tr>
                            <td className={`py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>Service ({settings.serviceCharge}%):</td>
                            <td className={`text-right py-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{formatCurrency(serviceCharge)}</td>
                          </tr>
                          <tr className={`border-t ${theme === "dark" ? "border-gray-600" : "border-gray-300"} font-bold`}>
                            <td className={`py-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>TOTAL:</td>
                            <td className="text-right py-2 text-lg text-blue-600 dark:text-blue-400">{formatCurrency(total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}

                  <div className={`border-t border-dashed ${theme === "dark" ? "border-gray-500" : "border-gray-400"} my-3`}></div>

                  <div className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    <div>
                      <strong>Metode Bayar:</strong> {
                        selectedOrder.paymentMethod === 'cash' ? 'Tunai' : 
                        selectedOrder.paymentMethod === 'qris' ? 'QRIS' : 'Non-Tunai'
                      }
                    </div>
                    <div>
                      <strong>Status:</strong> <span className="text-green-600">LUNAS</span>
                    </div>
                  </div>

                  <div className={`text-center text-xs mt-6 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    <div className="font-bold mb-2">{settings.receiptFooter}</div>
                    <div>Terima kasih atas kunjungan Anda!</div>
                    <div className="mt-2">*** {new Date().toLocaleDateString('id-ID')} ***</div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <motion.button
                  onClick={() => setShowReceiptModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                >
                  Tutup
                </motion.button>
                <motion.button
                  onClick={handlePrintReceipt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Printer className="w-5 h-5" />
                  Print Struk
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
