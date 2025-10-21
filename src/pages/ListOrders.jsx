import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext"; // ✅ Import theme context

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);

  const { theme } = useTheme(); // ✅ Ambil theme dari context

  useEffect(() => {
    const fetchOrders = () => {
      const stored = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
      setOrders(stored);
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = (updatedOrder) => {
    const updatedOrders = orders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order
    );

    localStorage.setItem("ordersOnProgress", JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
    setShowModal(false);
    toast.success("Perubahan pesanan berhasil disimpan");
  };

  const handleComplete = (order) => {
    setConfirmOrder(order);
  };

  const confirmComplete = () => {
    if (!confirmOrder) return;

    const remainingOrders = orders.filter((o) => o.id !== confirmOrder.id);
    const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];

    const now = new Date();
    const completedOrder = {
      ...confirmOrder,
      status: "Selesai",
      waktu: now.toLocaleTimeString("id-ID", { hour12: false }),
      tanggal: now.toLocaleDateString("id-ID"),
    };

    localStorage.setItem("ordersOnProgress", JSON.stringify(remainingOrders));
    localStorage.setItem(
      "ordersDone",
      JSON.stringify([...doneOrders, completedOrder])
    );
    setOrders(remainingOrders);

    const tables = JSON.parse(localStorage.getItem("tables")) || [];
    const updatedTables = tables.map((table) =>
      table.id === confirmOrder.tableId
        ? { ...table, status: "Kosong", currentOrder: null }
        : table
    );
    localStorage.setItem("tables", JSON.stringify(updatedTables));

    toast.success(`Pesanan ${confirmOrder.namaMeja} diselesaikan & meja dikosongkan ✅`);
    setConfirmOrder(null);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(JSON.parse(JSON.stringify(order)));
    setShowModal(true);
  };

  const updateItemQty = (index, newQty) => {
    if (newQty < 1) return;
    const updated = { ...selectedOrder };
    updated.items[index].qty = newQty;
    setSelectedOrder(updated);
  };

  const updateItemNote = (index, newNote) => {
    const updated = { ...selectedOrder };
    updated.items[index].catatan = newNote;
    setSelectedOrder(updated);
  };

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${
        theme === "light" ? "bg-[#f9fafb] text-gray-900" : "bg-gray-900 text-gray-200"
      }`}
    >
      <h1 className="text-4xl font-bold text-center mb-8 text-green-500">
        🧾 Daftar Pesanan Sedang Berlangsung
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-xl">
          Belum ada pesanan yang sedang berlangsung.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`p-6 rounded-2xl shadow border transition ${
                theme === "light"
                  ? "bg-white border-gray-200 hover:shadow-md"
                  : "bg-gray-800 border-gray-700 hover:shadow-lg"
              }`}
            >
              <h2 className="text-2xl font-bold text-green-500 mb-2">
                Meja: {order.namaMeja}
              </h2>
              <p className="text-sm text-gray-500 mb-2">
                {order.tanggal} • {order.waktu}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-lg">
                    <span>
                      {item.nama} × {item.qty}
                      {item.catatan && (
                        <span className="text-sm italic text-gray-400">
                          {" "}
                          ({item.catatan})
                        </span>
                      )}
                    </span>
                    <span>
                      Rp {(item.harga * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t pt-3 flex justify-between text-xl font-semibold border-gray-600">
                <span>Total:</span>
                <span className="text-green-400">
                  Rp {order.totalHarga.toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-green-500 font-semibold text-center">
                {order.status}
              </p>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => handleEditClick(order)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleComplete(order)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                >
                  Selesaikan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Edit */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div
            className={`rounded-2xl p-6 w-96 shadow-lg transition ${
              theme === "light" ? "bg-white text-gray-900" : "bg-gray-800 text-gray-200"
            }`}
          >
            <h2 className="text-2xl font-bold text-green-500 mb-4 text-center">
              Edit Pesanan - {selectedOrder.namaMeja}
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {selectedOrder.items.map((item, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl ${
                    theme === "light" ? "bg-gray-100" : "bg-gray-700"
                  }`}
                >
                  <p className="font-semibold text-lg">{item.nama}</p>
                  <div className="flex justify-between items-center mt-2">
                    <label className="text-sm">Jumlah:</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateItemQty(i, parseInt(e.target.value))
                      }
                      className={`w-16 text-center rounded border focus:ring-2 outline-none ${
                        theme === "light"
                          ? "border-gray-300 bg-white focus:ring-green-500"
                          : "border-gray-600 bg-gray-900 text-white focus:ring-green-500"
                      }`}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="text-sm">Catatan:</label>
                    <input
                      type="text"
                      value={item.catatan || ""}
                      onChange={(e) => updateItemNote(i, e.target.value)}
                      className={`w-full rounded border px-2 py-1 mt-1 focus:ring-2 outline-none ${
                        theme === "light"
                          ? "border-gray-300 bg-white focus:ring-green-500"
                          : "border-gray-600 bg-gray-900 text-white focus:ring-green-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleSave(selectedOrder)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi */}
      {confirmOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div
            className={`p-6 rounded-2xl w-80 text-center shadow-lg transition ${
              theme === "light" ? "bg-white text-gray-900" : "bg-gray-800 text-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 text-green-500">
              Selesaikan Pesanan?
            </h2>
            <p className="mb-6">
              Apakah yakin ingin menyelesaikan pesanan{" "}
              <span className="font-semibold text-green-500">
                {confirmOrder.namaMeja}
              </span>
              ?
            </p>

            <div className="flex justify-between">
              <button
                onClick={() => setConfirmOrder(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg w-1/2 mx-1"
              >
                Batal
              </button>
              <button
                onClick={confirmComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-1/2 mx-1"
              >
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
