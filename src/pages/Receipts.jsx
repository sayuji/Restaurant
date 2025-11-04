import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Receipt, 
  Printer, 
  Download, 
  Search, 
  Filter,
  Calendar,
  Eye,
  FileText,
  Store,
  Users,
  CreditCard,
  Clock,
  ArrowLeft,
  Loader
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import Swal from 'sweetalert2';
import { useTheme } from '../context/ThemeContext';

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
      
      // Filter hanya orders yang completed/selesai - SAMA DENGAN HISTORYORDERS
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
      Swal.fire('Error', 'Gagal memuat data struk', 'error');
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
    // Handle berbagai format items dari database
    if (!order.items) return [];
    
    return order.items.map(item => {
      // Format 1: { nama, qty, harga, catatan }
      // Format 2: { menu_name, quantity, price, notes }
      // Format 3: { name, quantity, price }
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
    
    // Gunakan total dari database jika ada, kalau tidak hitung manual
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
    
    const orderDate = new Date(order.created_at).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const matchesDate = dateFilter === 'all' ||
      (dateFilter === 'today' && orderDate === today) ||
      (dateFilter === 'yesterday' && orderDate === yesterday) ||
      (dateFilter === 'week' && (new Date() - new Date(order.created_at)) < 7 * 86400000);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    
    // Auto detect dark mode untuk print
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
  };

  const handleDownloadReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    const printWindow = window.open('', '_blank');
    
    // Auto detect dark mode untuk download
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Memuat data struk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Receipt className="w-8 h-8 text-green-600" />
            Management Struk
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Lihat dan print struk transaksi ({filteredOrders.length} orders)
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari no meja, order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Completed</option>
              <option value="Selesai">Selesai</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Tanggal</option>
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="week">7 Hari Terakhir</option>
            </select>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-800 dark:text-blue-200 text-center">
              <div className="font-semibold">Total Transaksi</div>
              <div className="text-lg font-bold">{filteredOrders.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
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
              {filteredOrders.map((order) => {
                const { total } = calculateReceiptTotals(order);
                
                return (
                  <motion.tr 
                    key={order.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            Order #{order.id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {getOrderItems(order).length} items
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
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
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
                          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
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
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Struk Order #{selectedOrder.id}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatDate(selectedOrder.createdAt || selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Receipt Content */}
            <div id="receipt-content" className={`p-6 rounded-lg border-2 border-dashed ${
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
                        <td className="text-right py-2 text-lg text-green-600">
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

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Struk
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}