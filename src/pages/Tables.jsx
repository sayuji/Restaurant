import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { encryptTableParam } from "../utils/encryption";

export default function Tables() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);

  // 🔹 Load tables from localStorage on component mount
  useEffect(() => {
    const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
    if (savedTables.length > 0) {
      setTables(savedTables);
    } else {
      // Initialize with default tables if none exist
      const defaultTables = [
        { id: 1, name: "Meja 1", status: "kosong", capacity: 4 },
        { id: 2, name: "Meja 2", status: "terisi", capacity: 6 },
        { id: 3, name: "Meja 3", status: "kosong", capacity: 2 },
      ];
      setTables(defaultTables);
      localStorage.setItem("tables", JSON.stringify(defaultTables));
    }
  }, []);

  // 🔹 Save tables to localStorage whenever tables state changes
  useEffect(() => {
    if (tables.length > 0) {
      localStorage.setItem("tables", JSON.stringify(tables));
    }
  }, [tables]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [form, setForm] = useState({ name: "", status: "kosong", capacity: 4 });
  const [statusFilter, setStatusFilter] = useState("all"); // New filter state

  // Dynamic base URL function
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.protocol + '//' + window.location.host;
    } else {
      // Server-side fallback
      return 'http://localhost:3001';
    }
  };

  // Filter tables based on status
  const filteredTables = tables.filter(table => {
    if (statusFilter === "all") return true;
    return table.status === statusFilter;
  });

  // Get count for each status
  const getStatusCount = (status) => {
    if (status === "all") return tables.length;
    return tables.filter(table => table.status === status).length;
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

  const handleAddTable = () => {
    if (!form.name) return alert("Isi nama meja dulu!");
    const newTable = {
      id: tables.length ? Math.max(...tables.map(t => t.id)) + 1 : 1,
      name: form.name,
      status: form.status,
      capacity: parseInt(form.capacity) || 4,
    };
    setTables([...tables, newTable]);
    closeModal();
  };

  const handleEditTable = () => {
    if (!form.name) return alert("Nama meja tidak boleh kosong!");
    setTables(
      tables.map((t) =>
        t.id === modalData.id ? { 
          ...t, 
          name: form.name, 
          status: form.status, 
          capacity: parseInt(form.capacity) || 4 
        } : t
      )
    );
    closeModal();
  };

  const handleDeleteTable = () => {
    setTables(tables.filter((t) => t.id !== modalData.id));
    closeModal();
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    if (status === "kosong") {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  const handleCompleteOrder = () => {
  const orderData = JSON.parse(localStorage.getItem("orderData"));
  if (!orderData?.tableId) return;

  // 🔹 Ubah meja jadi "kosong" lagi
  const tables = JSON.parse(localStorage.getItem("tables")) || [];
  const updatedTables = tables.map((t) =>
    t.id === orderData.tableId ? { ...t, status: "kosong" } : t
  );
  localStorage.setItem("tables", JSON.stringify(updatedTables));

  // 🔹 Hapus order data setelah selesai
  localStorage.removeItem("orderData");

  alert("Pesanan selesai! Meja sudah dikosongkan.");
  navigate("/tables");
};


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Manajemen Meja</h2>
        <p className="text-gray-600">Kelola meja restoran dan QR code untuk pemesanan</p>
      </div>

      {/* Filter Pills and Action Button */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              statusFilter === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
            Semua Meja
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              statusFilter === "all" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {getStatusCount("all")}
            </span>
          </button>
          
          <button
            onClick={() => setStatusFilter("kosong")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              statusFilter === "kosong"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Tersedia
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              statusFilter === "kosong" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {getStatusCount("kosong")}
            </span>
          </button>
          
          <button
            onClick={() => setStatusFilter("terisi")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              statusFilter === "terisi"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Terisi
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              statusFilter === "terisi" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              {getStatusCount("terisi")}
            </span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={() => openModal("add")}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 justify-center sm:justify-start"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Meja Baru
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <div key={table.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{table.name}</h3>
                <span className={getStatusBadge(table.status)}>
                  {table.status === "kosong" ? "Tersedia" : "Terisi"}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">Scan untuk memesan:</p>
                <div className="flex justify-center">
                  <div className={`p-3 bg-white rounded-lg border-2 ${table.status === "kosong" ? "border-green-200" : "border-red-200"}`}>
                    <QRCodeCanvas
                      value={`${getBaseUrl()}/order?table=${encryptTableParam(table.id)}`}
                      size={120}
                      className={table.status === "kosong" ? "opacity-100" : "opacity-50"}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="mb-4">
                <div className={`w-3 h-3 rounded-full mx-auto ${table.status === "kosong" ? "bg-green-500" : "bg-red-500"}`}></div>
                <p className="text-xs text-gray-500 mt-1">
                  {table.status === "kosong" ? "Siap menerima pesanan" : "Sedang digunakan"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => openModal("edit", table)}
                  className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => openModal("delete", table)}
                  className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada meja</h3>
          <p className="text-gray-500">Tambahkan meja pertama untuk memulai</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            {modalData.type === "delete" ? (
              <div className="p-6">
                {/* Delete Modal Header */}
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hapus Meja</h3>
                    <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">
                  Yakin ingin menghapus <span className="font-semibold">"{modalData.name}"</span>?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteTable}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Add/Edit Modal Header */}
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {modalData.id ? "Edit Meja" : "Tambah Meja Baru"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {modalData.id ? "Perbarui informasi meja" : "Buat meja baru untuk restoran"}
                    </p>
                  </div>
                </div>
                
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Meja
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Meja 1, VIP Table, dll"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Meja
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="kosong">Kosong (Tersedia)</option>
                      <option value="terisi">Terisi (Sedang Digunakan)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kapasitas Meja
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Jumlah kursi"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={modalData.id ? handleEditTable : handleAddTable}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                    >
                      {modalData.id ? "Simpan Perubahan" : "Tambah Meja"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
