import { useEffect, useState } from "react";

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
    alert("Perubahan pesanan berhasil disimpan ✅");
  };

  const handleComplete = (order) => {
    const confirmFinish = window.confirm("Apakah yakin ingin menyelesaikan pesanan ini?");
    if (!confirmFinish) return;

    // cuma hapus pesanan yg id-nya sama
    const remainingOrders = orders.filter((o) => o.id !== order.id);
    const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];

    localStorage.setItem("ordersOnProgress", JSON.stringify(remainingOrders));
    localStorage.setItem(
      "ordersDone",
      JSON.stringify([...doneOrders, { ...order, status: "Selesai" }])
    );
    setOrders(remainingOrders);

    alert(`Pesanan untuk ${order.namaMeja} telah diselesaikan ✅`);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(JSON.parse(JSON.stringify(order))); // clone biar aman
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-green-400">
        🧾 Daftar Pesanan Sedang Berlangsung
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-400 text-xl">
          Belum ada pesanan yang sedang berlangsung.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-green-500 relative"
            >
              <h2 className="text-2xl font-bold text-green-300 mb-2">
                Meja: {order.namaMeja}
              </h2>
              <p className="text-gray-400 text-sm mb-2">
                {order.tanggal} • {order.waktu}
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-lg">
                    <span>
                      {item.nama} × {item.qty}
                      {item.catatan && (
                        <span className="text-gray-400 text-sm italic">
                          {" "}
                          ({item.catatan})
                        </span>
                      )}
                    </span>
                    <span>Rp {(item.harga * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-600 pt-3 flex justify-between text-xl font-semibold">
                <span>Total:</span>
                <span>Rp {order.totalHarga.toLocaleString()}</span>
              </div>

              <p className="mt-2 text-green-400 font-semibold text-center">
                {order.status}
              </p>

              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => handleEditClick(order)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleComplete(order)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-96 relative">
            <h2 className="text-2xl font-bold text-green-300 mb-4 text-center">
              Edit Pesanan - {selectedOrder.namaMeja}
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="bg-gray-700 p-3 rounded-xl">
                  <p className="font-semibold text-lg">{item.nama}</p>
                  <div className="flex justify-between items-center mt-2">
                    <label className="text-sm">Jumlah:</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) =>
                        updateItemQty(i, parseInt(e.target.value))
                      }
                      className="w-16 text-center rounded bg-gray-900 text-white border border-gray-600"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="text-sm">Catatan:</label>
                    <input
                      type="text"
                      value={item.catatan || ""}
                      onChange={(e) => updateItemNote(i, e.target.value)}
                      className="w-full rounded bg-gray-900 text-white border border-gray-600 px-2 py-1 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleSave(selectedOrder)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
