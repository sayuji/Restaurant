import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Printer, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Eye,
  FileText,
  Users,
  CreditCard,
  Clock,
  ArrowLeft,
  Loader,
  Package
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Receipts() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Restaurant settings dari localStorage
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
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll();
      
      // Filter hanya orders yang completed/selesai
      const completedOrders = response
        .filter(order => order.status === 'completed' || order.status === 'Selesai')
        .map(order => ({
          id: order.id,
          tableId: order.table_id,
          tableName: order.table_name,
          items: order.items || [],
          totalHarga: order.total_price,
          status: order.status,
          createdAt: order.created_at,
          completedAt: order.updated_at || order.created_at,
          waktu: new Date(order.created_at).toLocaleTimeString("id-ID", { hour12: false }),
          tanggal: new Date(order.created_at).toLocaleDateString("id-ID"),
          paymentMethod: order.payment_method || 'cash'
        }));
      
      setOrders(completedOrders);
      console.log('✅ Receipts orders loaded:', completedOrders.length);
    } catch (error) {
      console.error('❌ Gagal memuat orders untuk receipts:', error);
      toast.error('Gagal memuat data struk');
      
      // Fallback ke localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("ordersDone")) || [];
        setOrders(stored);
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem("restaurantSettings")) || {};
    setSettings(prev => ({ ...prev, ...savedSettings }));
  };

  // 🔥 FUNGSI UNTUK AMBIL DATA ITEMS YANG KONSISTEN
  const getOrderItems = (order) => {
    if (!order.items) return [];
    
    return order.items.map(item => {
      return {
        name: item.nama || item.menu_name || item.name,
        quantity: item.qty || item.quantity,
        price: item.harga || item.price,
        notes: item.catatan || item.notes
      };
    });
  };

  // 🔥 FUNGSI UNTUK HITUNG TOTAL YANG KONSISTEN
  const calculateReceiptTotals = (order) => {
    const items = getOrderItems(order);
    
    const subtotal = order.totalHarga || order.total_price || 
                    items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const tax = (subtotal * settings.taxRate) / 100;
    const serviceCharge = (subtotal * settings.serviceCharge) / 100;
    const total = subtotal + tax + serviceCharge;

    return { 
      subtotal, 
      tax, 
      serviceCharge, 
      total,
      items 
    };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const orderDate = new Date(order.createdAt).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && orderDate === today) ||
      (dateFilter === 'yesterday' && orderDate === yesterday) ||
      (dateFilter === 'week' && (new Date() - new Date(order.createdAt)) < 7 * 86400000);

    return matchesSearch && matchesStatus && matchesDate;
  });

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

  const handleDownloadReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    
    const isDarkMode = theme === "dark";
    const backgroundColor = isDarkMode ? "#1f2937" : "#ffffff";
    const textColor = isDarkMode ? "#f3f4f6" : "#111827";
    const borderColor = isDarkMode ? "#4b5563" : "#374151";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${settings.restaurantName}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            font-size: 14px; 
            margin: 20px;
            max-width: 400px;
            background: ${backgroundColor};
            color: ${textColor};
          }
          .receipt { 
            border: 2px solid ${borderColor}; 
            padding: 20px; 
            border-radius: 10px;
            background: ${backgroundColor};
          }
          .header { text-align: center; margin-bottom: 15px; }
          .restaurant-name { font-weight: bold; font-size: 18px; color: ${textColor}; }
          .divider { border-top: 2px solid ${borderColor}; margin: 15px 0; }
          .items { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .items td { padding: 5px 0; border-bottom: 1px dotted ${borderColor}; color: ${textColor}; }
          .items .qty { width: 30px; text-align: center; font-weight: bold; }
          .items .name { padding-left: 10px; }
          .items .price { text-align: right; font-weight: bold; }
          .totals { width: 100%; margin-top: 15px; }
          .totals td { padding: 5px 0; color: ${textColor}; }
          .totals .label { text-align: left; font-weight: bold; }
          .totals .amount { text-align: right; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: ${textColor}; }
          .thank-you { font-weight: bold; margin: 15px 0; color: ${textColor}; }
          .total-amount { font-size: 18px; color: #10b981; font-weight: bold; }
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
    
    toast.success("Struk berhasil didownload");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: settings.currency || 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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

  // Statistics
  const stats = {
    total: filteredOrders.length,
    revenue: filteredOrders.reduce((sum, order) => {
      const { total } = calculateReceiptTotals(order);
      return sum + total;
    }, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Memuat data struk...
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
              <Receipt className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Management Struk
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Lihat dan print struk transaksi
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Transaksi</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(stats.revenue)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendapatan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan meja, order ID, atau metode pembayaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Completed</option>
              <option value="Selesai">Selesai</option>
              <option value="paid">Paid</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">7 Hari Terakhir</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl shadow-lg overflow-hidden transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Meja
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.map((order, index) => {
                const { total, items } = calculateReceiptTotals(order);
                
                return (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Order #{order.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {items.length} items
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.tableName || order.table_name || `Meja ${order.tableId}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(total)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentMethod === 'cash' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        {order.paymentMethod === 'cash' ? 'Tunai' : 
                         order.paymentMethod === 'qris' ? 'QRIS' : 'Non-Tunai'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(order.createdAt || order.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleViewReceipt(order)}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 text-sm shadow-lg hover:shadow-xl"
                        >
                          <Eye className="w-4 h-4" />
                          Lihat Struk
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {orders.length === 0 ? 'Belum ada transaksi' : 'Tidak ada transaksi yang sesuai dengan filter'}
            </p>
          </div>
        )}
      </motion.div>

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
              {/* Modal Header */}
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
                        {formatDate(selectedOrder.createdAt || selectedOrder.created_at)}
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

              {/* Receipt Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div id="receipt-content" className={`p-6 rounded-xl border-2 border-dashed ${
                  theme === "dark" 
                    ? "bg-gray-900 border-gray-600 text-white" 
                    : "bg-white border-gray-300"
                }`}>
                  {/* Receipt Header */}
                  <div className="text-center mb-4">
                    <div className={`text-lg font-bold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      {settings.restaurantName}
                    </div>
                    <div className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {settings.restaurantAddress}
                    </div>
                    <div className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {settings.restaurantPhone}
                    </div>
                    <div className={`text-xs mt-2 ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {settings.receiptHeader}
                    </div>
                  </div>

                  <div className={`border-t border-dashed ${
                    theme === "dark" ? "border-gray-500" : "border-gray-400"
                  } my-3`}></div>

                  {/* Order Info */}
                  <div className="flex justify-between text-sm mb-4">
                    <div>
                      <div className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        Order: <strong className={theme === "dark" ? "text-white" : "text-gray-900"}>#{selectedOrder.id}</strong>
                      </div>
                      <div className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        Meja: <strong className={theme === "dark" ? "text-white" : "text-gray-900"}>
                          {selectedOrder.tableName || selectedOrder.table_name || `Meja ${selectedOrder.tableId}`}
                        </strong>
                      </div>
                    </div>
                    <div className={`text-right ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      <div>Tanggal: {new Date(selectedOrder.createdAt || selectedOrder.created_at).toLocaleDateString('id-ID')}</div>
                      <div>Waktu: {new Date(selectedOrder.createdAt || selectedOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>

                  <div className={`border-t border-dashed ${
                    theme === "dark" ? "border-gray-500" : "border-gray-400"
                  } my-3`}></div>

                  {/* Order Items */}
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className={`border-b ${
                        theme === "dark" ? "border-gray-600" : "border-gray-300"
                      }`}>
                        <th className={`text-left pb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Item
                        </th>
                        <th className={`text-center pb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Qty
                        </th>
                        <th className={`text-right pb-2 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const { items } = calculateReceiptTotals(selectedOrder);
                        return items.map((item, index) => (
                          <tr key={index} className={`border-b ${
                            theme === "dark" ? "border-gray-700" : "border-gray-200"
                          }`}>
                            <td className="py-2">
                              <div className={`font-medium ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>
                                {item.name}
                              </div>
                              {item.notes && (
                                <div className={`text-xs italic ${
                                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                                }`}>
                                  Note: {item.notes}
                                </div>
                              )}
                              <div className={`text-xs ${
                                theme === "dark" ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {formatCurrency(item.price)}
                              </div>
                            </td>
                            <td className={`text-center py-2 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              x{item.quantity}
                            </td>
                            <td className={`text-right py-2 font-medium ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {formatCurrency(item.price * item.quantity)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>

                  <div className={`border-t border-dashed ${
                    theme === "dark" ? "border-gray-500" : "border-gray-400"
                  } my-3`}></div>

                  {/* Totals */}
                  {(() => {
                    const { subtotal, tax, serviceCharge, total } = calculateReceiptTotals(selectedOrder);
                    
                    return (
                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className={`py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Subtotal:
                            </td>
                            <td className={`text-right py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                          <tr>
                            <td className={`py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Pajak ({settings.taxRate}%):
                            </td>
                            <td className={`text-right py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {formatCurrency(tax)}
                            </td>
                          </tr>
                          <tr>
                            <td className={`py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              Service ({settings.serviceCharge}%):
                            </td>
                            <td className={`text-right py-1 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-700"
                            }`}>
                              {formatCurrency(serviceCharge)}
                            </td>
                          </tr>
                          <tr className={`border-t ${
                            theme === "dark" ? "border-gray-600" : "border-gray-300"
                          } font-bold`}>
                            <td className={`py-2 ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              TOTAL:
                            </td>
                            <td className="text-right py-2 text-lg text-blue-600 dark:text-blue-400">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}

                  <div className={`border-t border-dashed ${
                    theme === "dark" ? "border-gray-500" : "border-gray-400"
                  } my-3`}></div>

                  {/* Payment Info */}
                  <div className={`text-sm mb-4 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
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

                  {/* Receipt Footer */}
                  <div className={`text-center text-xs mt-6 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    <div className="font-bold mb-2">{settings.receiptFooter}</div>
                    <div>Terima kasih atas kunjungan Anda!</div>
                    <div className="mt-2">*** {new Date().toLocaleDateString('id-ID')} ***</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
                <motion.button
                  onClick={handleDownloadReceipt}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-5 h-5" />
                  Download
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}