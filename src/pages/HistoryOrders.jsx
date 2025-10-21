import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

export default function HistoryOrders() {
  const { theme } = useTheme(); // ⬅️ akses theme dari context
  const [doneOrders, setDoneOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    const fetchData = () => {
      const stored = JSON.parse(localStorage.getItem("ordersDone")) || [];
      setDoneOrders(stored);
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Yakin hapus riwayat pesanan ini?")) return;
    const updated = doneOrders.filter((o) => o.id !== id);
    localStorage.setItem("ordersDone", JSON.stringify(updated));
    setDoneOrders(updated);
    toast.success("Riwayat pesanan dihapus");
  };

  const filteredOrders = doneOrders.filter((order) => {
    const keyword = filterText.toLowerCase();
    return (
      order.namaMeja.toLowerCase().includes(keyword) ||
      order.tanggal.toLowerCase().includes(keyword) ||
      order.items.some((item) => item.nama.toLowerCase().includes(keyword))
    );
  });

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"
      }`}
    >
      <h1 className="text-3xl font-bold text-green-500 mb-6">
        📜 Riwayat Pesanan Selesai
      </h1>

      {/* Filter/Search */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="🔍 Cari meja, tanggal, atau menu..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className={`border rounded-lg px-3 py-2 w-80 focus:ring-2 focus:ring-green-400 outline-none placeholder-gray-500 ${
            theme === "dark"
              ? "bg-gray-800 text-gray-100 border-gray-700"
              : "bg-white text-gray-900 border-gray-300"
          }`}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total Pesanan: <span className="font-semibold">{doneOrders.length}</span>
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-lg text-gray-500 dark:text-gray-400">
          Belum ada pesanan selesai.
        </p>
      ) : (
        <div
          className={`overflow-x-auto rounded-xl shadow border transition ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="p-3 text-left">Meja</th>
                <th className="p-3 text-left">Tanggal</th>
                <th className="p-3 text-left">Waktu</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`transition border-b ${
                    theme === "dark"
                      ? "border-gray-700 hover:bg-green-900"
                      : "border-gray-200 hover:bg-green-100"
                  }`}
                >
                  <td className="p-3 font-medium">{order.namaMeja}</td>
                  <td className="p-3">{order.tanggal}</td>
                  <td className="p-3">{order.waktu}</td>
                  <td className="p-3 text-green-500 font-semibold">
                    Rp {Number(order.totalHarga).toLocaleString()}
                  </td>
                  <td className="p-3 text-green-400 font-semibold">
                    {order.status}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Pesanan */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div
            className={`rounded-xl shadow-lg p-6 w-full max-w-md relative transition ${
              theme === "dark"
                ? "bg-gray-800 text-gray-100 border border-gray-700"
                : "bg-white text-gray-900 border border-gray-200"
            }`}
          >
            <h2 className="text-2xl font-bold text-green-500 mb-4 text-center">
              Detail Pesanan - {selectedOrder.namaMeja}
            </h2>

            <div className="space-y-2">
              <p>
                <strong>Tanggal:</strong> {selectedOrder.tanggal}
              </p>
              <p>
                <strong>Waktu:</strong> {selectedOrder.waktu}
              </p>
              <p>
                <strong>Metode Pembayaran:</strong> {selectedOrder.paymentMethod}
              </p>

              <div className="mt-4 border-t pt-2 border-gray-600 dark:border-gray-300">
                <h3 className="font-semibold mb-2 text-green-500">🍽️ Daftar Menu</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm border-b border-gray-600 dark:border-gray-300 pb-1"
                    >
                      <span>
                        {item.nama} × {item.qty}
                        {item.catatan && (
                          <span className="text-gray-400 italic"> ({item.catatan})</span>
                        )}
                      </span>
                      <span>Rp {(Number(item.harga) * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t pt-2 border-gray-600 dark:border-gray-300 flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-green-500">
                  Rp {Number(selectedOrder.totalHarga).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
