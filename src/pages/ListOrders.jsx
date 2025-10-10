import { useEffect, useState } from "react";

export default function ListOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = () => {
      const stored = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
      setOrders(stored);
    };

    fetchOrders();

    // auto refresh setiap 5 detik biar update real-time
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
          {orders.map((order, index) => (
            <div
              key={index}
              className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-green-500"
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
