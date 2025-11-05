import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  QrCode, 
  Users,
  Download,
  Table as TableIcon,
  Clock,
  CheckCircle,
  X,
  Loader
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { encryptTableParam } from "../utils/encryption";
import { useTheme } from "../context/ThemeContext";
import { tablesAPI } from '../services/api';
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

export default function Tables() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [form, setForm] = useState({ name: "", status: "kosong", capacity: 4 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState(null);

  // 🔥 LOAD TABLES DARI DATABASE
  useEffect(() => {
    loadTablesFromBackend();
  }, []);

  const loadTablesFromBackend = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading tables dari database...');
      const tablesData = await tablesAPI.getAll();
      
      // Pastikan tablesData adalah array
      const tablesArray = Array.isArray(tablesData) ? tablesData : (tablesData.data || []);
      
      setTables(tablesArray);
      console.log('✅ Tables loaded:', tablesArray.length);
      
      // Simpan ke localStorage sebagai backup
      localStorage.setItem("tables", JSON.stringify(tablesArray));
    } catch (error) {
      console.error('❌ Gagal memuat tables dari backend:', error);
      // Fallback ke localStorage
      try {
        const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
        setTables(savedTables);
        console.log('🔄 Using localStorage fallback for tables');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
        setTables([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesStatus = statusFilter === "all" || table.status === statusFilter;
    const matchesSearch = table?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Statistics
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === "kosong").length,
    occupied: tables.filter(t => t.status === "terisi").length,
    totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0)
  };

  const openModal = (type, table = {}) => {
    setModalData({ ...table, type });
    if (type === "edit") {
      setForm({ name: table.name, status: table.status, capacity: table.capacity || 4 });
    } else if (type === "add") {
      setForm({ name: "", status: "kosong", capacity: 4 });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: "", status: "kosong", capacity: 4 });
  };

  // 🔥 ADD TABLE KE DATABASE
  const handleAddTable = async () => {
    if (!form.name.trim()) {
      toast.error("Isi nama meja dulu!");
      return;
    }

    setLoading(true);
    
    try {
      const newTableData = {
        name: form.name,
        capacity: parseInt(form.capacity) || 4,
        status: form.status
      };

      console.log('➕ Creating table in database:', newTableData);
      
      const result = await tablesAPI.create(newTableData);
      
      setTables(prev => [...prev, result]);
      console.log('✅ Table created successfully:', result.id);
      
      closeModal();
      toast.success(`Meja ${form.name} berhasil ditambahkan`);
    } catch (error) {
      console.error('❌ Error creating table:', error);
      toast.error('Gagal membuat meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      const newTable = {
        id: Date.now(),
        name: form.name,
        status: form.status,
        capacity: parseInt(form.capacity) || 4,
        createdAt: new Date().toISOString()
      };
      
      setTables(prev => [...prev, newTable]);
      localStorage.setItem("tables", JSON.stringify([...tables, newTable]));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  // 🔥 EDIT TABLE DI DATABASE
  const handleEditTable = async () => {
    if (!form.name.trim()) {
      toast.error("Nama meja tidak boleh kosong!");
      return;
    }

    setLoading(true);
    
    try {
      const updatedTableData = {
        name: form.name,
        status: form.status,
        capacity: parseInt(form.capacity) || 4
      };

      console.log('✏️ Updating table in database:', modalData.id, updatedTableData);
      
      const result = await tablesAPI.update(modalData.id, updatedTableData);
      
      setTables(prev => prev.map((t) => t.id === modalData.id ? result : t));
      console.log('✅ Table updated successfully:', modalData.id);
      
      closeModal();
      toast.success(`Meja ${form.name} berhasil diupdate`);
    } catch (error) {
      console.error('❌ Error updating table:', error);
      toast.error('Gagal mengupdate meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      setTables(prev => prev.map((t) =>
        t.id === modalData.id ? { 
          ...t, 
          name: form.name, 
          status: form.status, 
          capacity: parseInt(form.capacity) || 4,
          updatedAt: new Date().toISOString()
        } : t
      ));
      
      localStorage.setItem("tables", JSON.stringify(tables));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DELETE TABLE DI DATABASE
  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    
    setLoading(true);
    
    try {
      console.log('🗑️ Deleting table from database:', tableToDelete.id);
      
      await tablesAPI.delete(tableToDelete.id);
      
      setTables(prev => prev.filter((t) => t.id !== tableToDelete.id));
      console.log('✅ Table deleted successfully:', tableToDelete.id);
      
      toast.success(`Meja ${tableToDelete.name} berhasil dihapus`);
    } catch (error) {
      console.error('❌ Error deleting table:', error);
      toast.error('Gagal menghapus meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      setTables(prev => prev.filter((t) => t.id !== tableToDelete.id));
      localStorage.setItem("tables", JSON.stringify(tables));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setTableToDelete(null);
    }
  };

  // 🔥 BULK DELETE TABLES DI DATABASE
  const handleBulkDelete = async () => {
    if (selectedTables.size === 0) return;
    
    setLoading(true);
    
    try {
      const deletePromises = Array.from(selectedTables).map(id => 
        tablesAPI.delete(id).catch(err => {
          console.error(`Failed to delete table ${id}:`, err);
          return null;
        })
      );
      
      await Promise.all(deletePromises);
      
      setTables(prev => prev.filter((t) => !selectedTables.has(t.id)));
      setSelectedTables(new Set());
      setShowBulkActions(false);
      
      toast.success(`${selectedTables.size} meja berhasil dihapus`);
    } catch (error) {
      console.error('❌ Error in bulk delete:', error);
      toast.error('Gagal menghapus beberapa meja');
      
      // Fallback ke localStorage
      setTables(prev => prev.filter((t) => !selectedTables.has(t.id)));
      localStorage.setItem("tables", JSON.stringify(tables));
      setSelectedTables(new Set());
      setShowBulkActions(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleTableSelection = (id) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTables(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllTables = () => {
    if (selectedTables.size === filteredTables.length) {
      setSelectedTables(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTables(new Set(filteredTables.map(table => table.id)));
      setShowBulkActions(true);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1";
    if (status === "kosong") {
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-800`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200 dark:border-red-800`;
    }
  };

  const exportQRCode = (table) => {
    const canvas = document.getElementById(`qrcode-${table.id}`);
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QRCode-${table.name}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success(`QR Code ${table.name} berhasil diunduh`);
    }
  };

  // Dynamic base URL function
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.protocol + '//' + window.location.host;
    }
    return 'http://localhost:3000';
  };

  const TableCard = ({ table, index }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl transition-all duration-300 hover:shadow-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${selectedTables.has(table.id) ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedTables.has(table.id)}
              onChange={() => toggleTableSelection(table.id)}
              className="w-4 h-4 text-white bg-white/20 rounded focus:ring-blue-500"
            />
            <h3 className="text-xl font-semibold">{table.name}</h3>
          </div>
          <span className={getStatusBadge(table.status)}>
            {table.status === "kosong" ? (
              <><CheckCircle className="w-3 h-3" /> Tersedia</>
            ) : (
              <><Clock className="w-3 h-3" /> Terisi</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-blue-100">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{table.capacity} orang</span>
          </div>
          <div>ID: {table.id}</div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="p-6 text-center">
        <div className="mb-4">
          <p className={`text-sm mb-3 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Scan untuk memesan
          </p>
          <div className="flex justify-center">
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
              table.status === "kosong" 
                ? theme === 'dark' 
                  ? 'border-green-600 bg-gray-700 hover:border-green-500' 
                  : 'border-green-200 bg-white hover:border-green-300'
                : theme === 'dark'
                  ? 'border-red-600 bg-gray-700 opacity-70'
                  : 'border-red-200 bg-white opacity-70'
            }`}>
              <QRCodeCanvas
                id={`qrcode-${table.id}`}
                value={`${getBaseUrl()}/order?table=${encryptTableParam(table.id)}`}
                size={140}
                className="transition-opacity duration-300"
              />
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="mb-4">
          <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
            table.status === "kosong" ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <p className={`text-xs ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
          }`}>
            {table.status === "kosong" ? "Siap menerima pesanan" : "Sedang digunakan"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => exportQRCode(table)}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
            title="Download QR Code"
          >
            <Download className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal("edit", table)}
            className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
            title="Edit Meja"
          >
            <Edit3 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTableToDelete(table);
              setShowDeleteModal(true);
            }}
            className="p-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center gap-1 shadow-lg hover:shadow-xl"
            title="Hapus Meja"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // Loading state
  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
            Memuat data meja...
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
              <TableIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Manajemen Meja
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola meja restoran dan QR code untuk pemesanan online
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Meja</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tersedia</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.occupied}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Terisi</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalCapacity}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Kapasitas</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Controls */}
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
              placeholder="Cari meja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="kosong">Tersedia</option>
              <option value="terisi">Terisi</option>
            </select>

            {/* View Toggle */}
            <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition-all duration-200 ${
                  viewMode === "grid"
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-inner'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 transition-all duration-200 ${
                  viewMode === "list"
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-inner'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Add Table Button */}
            <motion.button
              onClick={() => openModal("add")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Meja
            </motion.button>
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
                  {selectedTables.size} meja terpilih
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleBulkDelete}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Hapus yang Dipilih
                  </motion.button>
                  <button
                    onClick={() => {
                      setSelectedTables(new Set());
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

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl shadow-lg p-12 text-center transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <TableIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Tidak ada meja
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {tables.length === 0 
              ? "Tambahkan meja pertama untuk memulai" 
              : "Tidak ada meja yang sesuai dengan filter"
            }
          </p>
          <motion.button
            onClick={() => openModal("add")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Tambah Meja Pertama
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredTables.map((table, index) => (
              <TableCard key={table.id} table={table} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
              className="rounded-2xl w-full max-w-md transition-colors duration-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <TableIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {modalData.id ? "Edit Meja" : "Tambah Meja Baru"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {modalData.id ? "Perbarui informasi meja" : "Buat meja baru untuk restoran"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama Meja *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Meja 1, VIP Table, dll"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status Meja
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="kosong">Kosong (Tersedia)</option>
                      <option value="terisi">Terisi (Sedang Digunakan)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kapasitas Meja *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Jumlah kursi"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      onClick={closeModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                    >
                      Batal
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={modalData.id ? handleEditTable : handleAddTable}
                      disabled={loading}
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                      className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        modalData.id ? "Simpan Perubahan" : "Tambah Meja"
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTableToDelete(null);
        }}
        onConfirm={handleDeleteTable}
        message={
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Hapus Meja?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Yakin ingin menghapus meja{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                {tableToDelete?.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        }
        confirmText={loading ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        loading={loading}
        confirmColor="red"
      />
    </div>
  );
}