import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle, 
  Clock, 
  Users, 
  X,
  Plus,
  Minus,
  ChefHat,
  Loader,
  Package
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";
import { ordersAPI, tablesAPI } from '../services/api';
import ConfirmModal from "../components/ConfirmModal";

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { theme } = useTheme();

  // 🔥 LOAD ORDERS DARI DATABASE
  useEffect(() => {
    loadOrdersFromDatabase();
    
    // Real-time polling setiap 5 detik
    const interval = setInterval(loadOrdersFromDatabase, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOrdersFromDatabase = async () => {
    try {
      console.log('🔄 Loading orders dari database...');
      const ordersData = await ordersAPI.getAll();
      
      // Transform data dari database ke format yang diharapkan
      const transformedOrders = ordersData
        .filter(order => order.status !== 'completed')
        .map(order => {
          // Fix JSON items yang rusak
          let fixedItems = [];
          try {
            if (typeof order.items === 'string') {
              fixedItems = JSON.parse(order.items);
            } else {
              fixedItems = order.items || [];
            }
            
            // Normalize item structure
            fixedItems = fixedItems.map(item => ({
              id: item.id || item.City, 
              nama: item.name || item.nama,
              qty: item.qty || item.quantity || item.City,
              harga: item.harga || item.price || item.hangt,
              catatan: item.catatan || item.notes || item.catstar
            }));
          } catch (error) {
            console.error('Error parsing items for order', order.id, error);
            fixedItems = [];
          }
          
          return {
            id: order.id,
            tableId: order.table_id,
            namaMeja: order.table_name,
            items: fixedItems,
            totalHarga: order.total_price,
            status: "Sedang Diproses", // 🔥 HANYA SEDANG DIPROSES
            createdAt: order.created_at,
            waktu: new Date(order.created_at).toLocaleTimeString("id-ID", { hour12: false }),
            tanggal: new Date(order.created_at).toLocaleDateString("id-ID"),
            paymentMethod: order.payment_method || 'cash'
          };
        });
      
      setOrders(transformedOrders);
      console.log('✅ Active orders loaded:', transformedOrders.length);
    } catch (error) {
      console.error('❌ Gagal memuat orders dari database:', error);
      
      // 🔥 FALLBACK KE LOCALSTORAGE
      try {
        const stored = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
        setOrders(stored);
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATE ORDER DI DATABASE
  const handleSave = async (updatedOrder) => {
    setUpdating(true);
    try {
      console.log('🔄 Updating order in database:', updatedOrder.id);
      
      const orderPayload = {
        tableId: updatedOrder.tableId,
        tableName: updatedOrder.namaMeja,
        items: updatedOrder.items.map(item => ({
          nama: item.nama || item.menu_name,
          qty: item.qty || item.quantity,
          harga: item.harga || item.price,
          catatan: item.catatan || item.notes
        })),
        totalHarga: updatedOrder.totalHarga,
        status: 'processing' // 🔥 HANYA PROCESSING
      };

      await ordersAPI.update(updatedOrder.id, orderPayload);
      
      // Update local state
      const updatedOrders = orders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      );
      setOrders(updatedOrders);
      
      setShowModal(false);
      toast.success("✅ Perubahan pesanan berhasil disimpan");
    } catch (error) {
      console.error('❌ Error updating order:', error);
      toast.error('Gagal menyimpan perubahan');
      
      // Fallback ke localStorage
      const updatedOrders = orders.map((order) =>
        order.id === updatedOrder.id ? updatedOrder : order
      );
      localStorage.setItem("ordersOnProgress", JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      setShowModal(false);
    } finally {
      setUpdating(false);
    }
  };

  // 🔥 COMPLETE ORDER DI DATABASE
  const handleComplete = (order) => {
    setConfirmOrder(order);
  };

  const confirmComplete = async () => {
    if (!confirmOrder) return;
    
    setUpdating(true);
    try {
      console.log('🔄 Completing order in database:', confirmOrder.id);
      
      // Update order status ke completed
      await ordersAPI.updateStatus(confirmOrder.id, 'completed');
      
      // Update table status ke kosong
      await tablesAPI.updateStatus(confirmOrder.tableId, 'kosong');
      
      // Update local state
      const remainingOrders = orders.filter((o) => o.id !== confirmOrder.id);
      setOrders(remainingOrders);

      // Simpan ke history/localStorage sebagai backup
      const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];
      const now = new Date();
      const completedOrder = {
        ...confirmOrder,
        status: "Selesai",
        completedAt: now.toISOString(),
        waktu: now.toLocaleTimeString("id-ID", { hour12: false }),
        tanggal: now.toLocaleDateString("id-ID"),
      };
      localStorage.setItem("ordersDone", JSON.stringify([...doneOrders, completedOrder]));

      toast.success(`🎉 Pesanan ${confirmOrder.namaMeja} selesai!`);
      setConfirmOrder(null);
      
    } catch (error) {
      console.error('❌ Error completing order:', error);
      toast.error('Gagal menyelesaikan pesanan');
      
      // Fallback ke localStorage
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
      localStorage.setItem("ordersDone", JSON.stringify([...doneOrders, completedOrder]));
      
      // Update table status di localStorage
      const tables = JSON.parse(localStorage.getItem("tables")) || [];
      const updatedTables = tables.map((table) =>
        table.id === confirmOrder.tableId
          ? { ...table, status: "kosong", currentOrder: null }
          : table
      );
      localStorage.setItem("tables", JSON.stringify(updatedTables));

      setOrders(remainingOrders);
      setConfirmOrder(null);
    } finally {
      setUpdating(false);
    }
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
      (sum, item) => sum + ((item.harga || item.price) * item.qty), 
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
      (sum, item) => sum + ((item.harga || item.price) * item.qty), 
      0
    );
    
    setSelectedOrder(updated);
  };

  const getStatusColor = () => {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
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

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    order?.namaMeja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => 
      item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.menu_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "table":
        return a.namaMeja.localeCompare(b.namaMeja);
      case "total":
        return b.totalHarga - a.totalHarga;
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    total: orders.length
  };

  // Loading state
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
                Daftar Pesanan Aktif
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola pesanan yang sedang berlangsung di restoran
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Pesanan</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
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
              placeholder="Cari pesanan berdasarkan meja atau menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Sort */}
          <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
      </motion.div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl shadow-lg p-12 text-center transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Tidak ada pesanan aktif
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {orders.length === 0 
              ? "Semua pesanan sudah selesai diproses" 
              : "Tidak ada pesanan yang sesuai dengan pencarian"
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
                className="rounded-2xl p-6 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    Sedang Diproses
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
                          {item.nama || item.menu_name} × {item.qty || item.quantity}
                        </p>
                        {(item.catatan || item.notes) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            📝 {item.catatan || item.notes}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 dark:text-white ml-4">
                        {formatCurrency((item.harga || item.price) * (item.qty || item.quantity))}
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
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(order.totalHarga)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleEditClick(order)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleComplete(order)}
                    disabled={updating}
                    whileHover={{ scale: updating ? 1 : 1.02 }}
                    whileTap={{ scale: updating ? 1 : 0.98 }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Selesaikan
                  </motion.button>
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
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
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
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          {item.nama || item.menu_name}
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
                              onClick={() => updateItemQty(i, (item.qty || item.quantity) - 1)}
                              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.qty || item.quantity}
                              onChange={(e) => updateItemQty(i, parseInt(e.target.value) || 1)}
                              className="w-16 text-center rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
                            />
                            <button
                              onClick={() => updateItemQty(i, (item.qty || item.quantity) + 1)}
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
                            value={item.catatan || item.notes || ""}
                            onChange={(e) => updateItemNote(i, e.target.value)}
                            placeholder="Tambah catatan..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-right">
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {formatCurrency((item.harga || item.price) * (item.qty || item.quantity))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Updated Total */}
                <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
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
                <motion.button
                  onClick={() => setShowModal(false)}
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
                  disabled={updating}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 ${
                    theme === "light"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmComplete}
                  disabled={updating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Ya, Selesaikan'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}