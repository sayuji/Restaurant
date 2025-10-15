import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);

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

    // Ambil data orders & done
    const remainingOrders = orders.filter((o) => o.id !== confirmOrder.id);
    const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];

    // Tambahkan waktu & tanggal selesai
    const now = new Date();
    const completedOrder = {
      ...confirmOrder,
      status: "Selesai",
      waktu: now.toLocaleTimeString("id-ID", { hour12: false }),
      tanggal: now.toLocaleDateString("id-ID"),
    };

    // Simpan perubahan order
    localStorage.setItem("ordersOnProgress", JSON.stringify(remainingOrders));
    localStorage.setItem(
      "ordersDone",
      JSON.stringify([...doneOrders, completedOrder])
    );
    setOrders(remainingOrders);

    // ✅ Kosongkan meja yang selesai
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-green-700">
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
              className="bg-white p-6 rounded-2xl shadow border border-gray-200 hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Meja: {order.namaMeja}
              </h2>
              <p className="text-gray-500 text-sm mb-2">
                {order.tanggal} • {order.waktu}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-lg">
                    <span>
                      {item.nama} × {item.qty}
                      {item.catatan && (
                        <span className="text-gray-500 text-sm italic">
                          {" "}
                          ({item.catatan})
                        </span>
                      )}
                    </span>
                    <span className="text-gray-800">
                      Rp {(item.harga * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between text-xl font-semibold">
                <span>Total:</span>
                <span className="text-green-700">
                  Rp {order.totalHarga.toLocaleString()}
                </span>
              </div>

              <p className="mt-2 text-green-600 font-semibold text-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
              Edit Pesanan - {selectedOrder.namaMeja}
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="bg-gray-100 p-3 rounded-xl">
                  <p className="font-semibold text-lg text-gray-800">
                    {item.nama}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <label className="text-sm text-gray-700">Jumlah:</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateItemQty(i, parseInt(e.target.value))
                      }
                      className="w-16 text-center rounded border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="text-sm text-gray-700">Catatan:</label>
                    <input
                      type="text"
                      value={item.catatan || ""}
                      onChange={(e) => updateItemNote(i, e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 mt-1 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-80 text-center shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-700">
              Selesaikan Pesanan?
            </h2>
            <p className="text-gray-700 mb-6">
              Apakah yakin ingin menyelesaikan pesanan{" "}
              <span className="font-semibold text-green-700">
                {confirmOrder.namaMeja}
              </span>
              ?
            </p>

            <div className="flex justify-between">
              <button
                onClick={() => setConfirmOrder(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg w-1/2 mx-1"
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
