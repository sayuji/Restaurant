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
  X
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { encryptTableParam } from "../utils/encryption";
import { useTheme } from "../context/ThemeContext";
import { tablesAPI } from '../services/api';

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

  // 🔥 LOAD TABLES DARI DATABASE - SAMA PATTERN DENGAN MENU.JSX
  useEffect(() => {
    loadTablesFromBackend();
  }, []);

  const loadTablesFromBackend = async () => {
    try {
      console.log('🔄 Loading tables dari database...');
      const tablesData = await tablesAPI.getAll();
      setTables(tablesData);
      console.log('✅ Tables loaded:', tablesData.length);
    } catch (error) {
      console.error('❌ Gagal memuat tables dari backend:', error);
      // Fallback ke localStorage
      try {
        const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
        setTables(savedTables);
        console.log('🔄 Using localStorage fallback for tables');
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    }
  };

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesStatus = statusFilter === "all" || table.status === statusFilter;
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get count for each status
  const getStatusCount = (status) => {
    if (status === "all") return tables.length;
    return tables.filter(table => table.status === status).length;
  };

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
      alert("Isi nama meja dulu!");
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
      
      // ✅ CREATE TABLE DI DATABASE
      const result = await tablesAPI.create(newTableData);
      
      // Add the new table to state
      setTables([...tables, result]);
      console.log('✅ Table created successfully:', result.id);
      
      closeModal();
    } catch (error) {
      console.error('❌ Error creating table:', error);
      alert('Gagal membuat meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      const newTable = {
        id: tables.length ? Math.max(...tables.map(t => t.id)) + 1 : 1,
        name: form.name,
        status: form.status,
        capacity: parseInt(form.capacity) || 4,
        createdAt: new Date().toISOString()
      };
      
      setTables([...tables, newTable]);
      localStorage.setItem("tables", JSON.stringify([...tables, newTable]));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  // 🔥 EDIT TABLE DI DATABASE
  const handleEditTable = async () => {
    if (!form.name.trim()) {
      alert("Nama meja tidak boleh kosong!");
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
      
      // ✅ UPDATE TABLE DI DATABASE
      const result = await tablesAPI.update(modalData.id, updatedTableData);
      
      // Update table in state
      setTables(tables.map((t) => t.id === modalData.id ? result : t));
      console.log('✅ Table updated successfully:', modalData.id);
      
      closeModal();
    } catch (error) {
      console.error('❌ Error updating table:', error);
      alert('Gagal mengupdate meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      setTables(
        tables.map((t) =>
          t.id === modalData.id ? { 
            ...t, 
            name: form.name, 
            status: form.status, 
            capacity: parseInt(form.capacity) || 4,
            updatedAt: new Date().toISOString()
          } : t
        )
      );
      localStorage.setItem("tables", JSON.stringify(tables));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DELETE TABLE DI DATABASE
  const handleDeleteTable = async () => {
    setLoading(true);
    
    try {
      console.log('🗑️ Deleting table from database:', modalData.id);
      
      // ✅ DELETE TABLE DI DATABASE
      await tablesAPI.delete(modalData.id);
      
      // Remove table from state
      setTables(tables.filter((t) => t.id !== modalData.id));
      console.log('✅ Table deleted successfully:', modalData.id);
      
      closeModal();
    } catch (error) {
      console.error('❌ Error deleting table:', error);
      alert('Gagal menghapus meja. Silakan coba lagi.');
      
      // Fallback ke localStorage
      setTables(tables.filter((t) => t.id !== modalData.id));
      localStorage.setItem("tables", JSON.stringify(tables.filter((t) => t.id !== modalData.id)));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTables.size === 0) return;
    
    if (!window.confirm(`Yakin hapus ${selectedTables.size} meja?`)) return;
    
    setTables(tables.filter((t) => !selectedTables.has(t.id)));
    setSelectedTables(new Set());
    setShowBulkActions(false);
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
      return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
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
      className={`rounded-2xl transition-all duration-300 hover:shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } ${selectedTables.has(table.id) ? 'ring-2 ring-blue-500' : ''}`}
    >
      {/* Card Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedTables.has(table.id)}
              onChange={() => toggleTableSelection(table.id)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
        <div className="flex items-center gap-4 text-sm text-gray-300">
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
          <button
            onClick={() => exportQRCode(table)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-1"
            title="Download QR Code"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal("edit", table)}
            className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center gap-1"
            title="Edit Meja"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openModal("delete", table)}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-1"
            title="Hapus Meja"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const TableListItem = ({ table, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-6 rounded-2xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } ${selectedTables.has(table.id) ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      <div className="flex items-center gap-4">
        <input
          type="checkbox"
          checked={selectedTables.has(table.id)}
          onChange={() => toggleTableSelection(table.id)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
              <TableIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                {table.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kapasitas: {table.capacity} orang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={getStatusBadge(table.status)}>
              {table.status === "kosong" ? "Tersedia" : "Terisi"}
            </span>
          </div>

          <div className="flex justify-center">
            <div className={`p-2 rounded-lg border ${
              table.status === "kosong" 
                ? 'border-green-200 dark:border-green-800' 
                : 'border-red-200 dark:border-red-800'
            }`}>
              <QRCodeCanvas
                value={`${getBaseUrl()}/order?table=${encryptTableParam(table.id)}`}
                size={60}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => exportQRCode(table)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Download QR"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => openModal("edit", table)}
              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => openModal("delete", table)}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏪 Manajemen Meja
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Kelola meja restoran dan QR code untuk pemesanan online
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-4 lg:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Meja</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.available}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tersedia</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.occupied}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Terisi</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-6 mb-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-lg'
        }`}
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
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter Pills */}
            <div className="flex gap-2">
              {["all", "kosong", "terisi"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    statusFilter === status
                      ? status === "all" 
                        ? "bg-blue-600 text-white shadow-lg"
                        : status === "kosong"
                        ? "bg-green-600 text-white shadow-lg"
                        : "bg-red-600 text-white shadow-lg"
                      : theme === 'dark'
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    status === "all" ? "bg-current opacity-70" :
                    status === "kosong" ? "bg-green-500" : "bg-red-500"
                  }`} />
                  {status === "all" ? "Semua" : status === "kosong" ? "Tersedia" : "Terisi"}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === status
                      ? "bg-white/20 text-white"
                      : theme === 'dark'
                      ? "bg-gray-600 text-gray-300"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                    {getStatusCount(status)}
                  </span>
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className={`flex rounded-xl border overflow-hidden ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition-colors ${
                  viewMode === "grid"
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 transition-colors ${
                  viewMode === "list"
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Add Table Button */}
            <button
              onClick={() => openModal("add")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Tambah Meja
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
                  {selectedTables.size} meja terpilih
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus yang Dipilih
                  </button>
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

      {/* Tables Grid/List */}
      {filteredTables.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-2xl p-12 text-center transition-colors duration-300 ${
            theme === 'dark' ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-lg'
          }`}
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
          <button
            onClick={() => openModal("add")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Tambah Meja Pertama
          </button>
        </motion.div>
      ) : (
        <>
          {/* Selection Header */}
          {selectedTables.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedTables.size === filteredTables.length}
                  onChange={selectAllTables}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  {selectedTables.size} meja terpilih
                </span>
              </div>
            </div>
          )}

          {/* Tables Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredTables.map((table, index) => (
                  <TableCard key={table.id} table={table} index={index} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredTables.map((table, index) => (
                  <TableListItem key={table.id} table={table} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
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
              className={`rounded-2xl w-full max-w-md transform transition-all ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              {modalData.type === "delete" ? (
                <div className="p-6">
                  {/* Delete Modal Header */}
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Hapus Meja</h3>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                        Tindakan ini tidak dapat dibatalkan
                      </p>
                    </div>
                  </div>
                  
                  <p className={`mb-6 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Yakin ingin menghapus <span className="font-semibold">"{modalData.name}"</span>?
                    Semua data terkait meja ini akan dihapus.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={closeModal}
                      className={`flex-1 px-4 py-3 border rounded-xl font-semibold transition-colors duration-200 ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDeleteTable}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors duration-200 ${
                        loading
                          ? 'bg-red-400 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white`}
                    >
                      {loading ? '🔄 Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Add/Edit Modal Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                        <TableIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {modalData.id ? "Edit Meja" : "Tambah Meja Baru"}
                        </h3>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          {modalData.id ? "Perbarui informasi meja" : "Buat meja baru untuk restoran"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Nama Meja *
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Meja 1, VIP Table, dll"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Status Meja
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="kosong">Kosong (Tersedia)</option>
                        <option value="terisi">Terisi (Sedang Digunakan)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Kapasitas Meja *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        placeholder="Jumlah kursi"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className={`flex-1 px-4 py-3 border rounded-xl font-semibold transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={modalData.id ? handleEditTable : handleAddTable}
                        disabled={loading}
                        className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                          loading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        } text-white`}
                      >
                        {loading ? '🔄 Memproses...' : (modalData.id ? "Simpan Perubahan" : "Tambah Meja")}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}