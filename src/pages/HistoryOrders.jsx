import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HistoryOrders() {
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
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-green-400 mb-6">
        📜 Riwayat Pesanan Selesai
      </h1>

      {/* Filter/Search */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <input
          type="text"
          placeholder="🔍 Cari meja, tanggal, atau menu..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="border border-gray-700 bg-gray-800 text-gray-100 rounded-lg px-3 py-2 w-80 focus:ring-2 focus:ring-green-400 outline-none placeholder-gray-500"
        />
        <p className="text-gray-400 text-sm">
          Total Pesanan: <span className="font-semibold">{doneOrders.length}</span>
        </p>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-center text-lg">
          Belum ada pesanan selesai.
        </p>
      ) : (
        <div className="overflow-x-auto bg-gray-800 rounded-xl shadow border border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-green-700 text-gray-100">
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
                  className="border-b border-gray-700 hover:bg-green-900 transition"
                >
                  <td className="p-3 font-medium">{order.namaMeja}</td>
                  <td className="p-3">{order.tanggal}</td>
                  <td className="p-3">{order.waktu}</td>
                  <td className="p-3 text-green-400 font-semibold">
                    Rp {Number(order.totalHarga).toLocaleString()}
                  </td>
                  <td className="p-3 text-green-300 font-semibold">
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
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md relative text-gray-100">
            <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">
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

              <div className="mt-4 border-t border-gray-700 pt-2">
                <h3 className="font-semibold mb-2 text-green-400">🍽️ Daftar Menu</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm border-b border-gray-700 pb-1"
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

              <div className="mt-4 border-t border-gray-700 pt-2 flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-green-400">
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
