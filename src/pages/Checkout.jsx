import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);

  // 🔹 Ambil data pesanan dari location atau localStorage
  useEffect(() => {
    if (location.state) {
      setOrderData(location.state);
      localStorage.setItem("orderData", JSON.stringify(location.state));
    } else {
      const saved = localStorage.getItem("orderData");
      if (saved) setOrderData(JSON.parse(saved));
    }
  }, [location.state]);

  if (!orderData) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Tidak ada data pesanan.
      </div>
    );
  }

  // 🔹 Hitung total harga
  const totalHarga =
    orderData.items?.reduce((acc, item) => acc + item.harga * item.qty, 0) || 0;

  // 🔹 Fungsi konfirmasi pesanan
  const handleConfirm = async () => {
    const result = await Swal.fire({
      title: "Konfirmasi Pesanan?",
      text: "Pastikan semua pesanan sudah benar sebelum dikonfirmasi.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, konfirmasi!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      // 🔹 Ambil daftar pesanan yang sedang berlangsung (untuk TV Display)
      const existingOrders =
        JSON.parse(localStorage.getItem("ordersOnProgress")) || [];

      // 🔹 Buat pesanan baru lengkap dengan waktu, tanggal, dan status
      const newOrder = {
        id: Date.now(),
        ...orderData,
        totalHarga,
        waktu: new Date().toLocaleTimeString(),
        tanggal: new Date().toLocaleDateString(),
        status: "Sedang Diproses",
      };

      // 🔹 Tambahkan pesanan baru ke daftar
      existingOrders.push(newOrder);
      localStorage.setItem("ordersOnProgress", JSON.stringify(existingOrders));

      // 🔹 Hapus order sementara (checkout)
      localStorage.removeItem("orderData");

      // 🔹 Tampilkan notifikasi sukses
      Swal.fire({
        title: "Berhasil!",
        text: "Pesanan berhasil dikonfirmasi 🎉",
        icon: "success",
        confirmButtonColor: "#16a34a",
        timer: 2000,
        showConfirmButton: false,
      });

      // 🔹 Redirect ke halaman utama setelah delay 2 detik
      setTimeout(() => navigate("/"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Checkout Pesanan
        </h1>

        {/* Daftar Pesanan */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Daftar Pesanan:</h2>
          <div className="space-y-2">
            {orderData.items.length > 0 ? (
              orderData.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.nama}</p>
                    <p className="text-gray-500">Qty: {item.qty}</p>
                    {item.catatan && (
                      <p className="text-gray-400 italic">"{item.catatan}"</p>
                    )}
                  </div>
                  <p className="font-semibold">
                    Rp {(item.harga * item.qty).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">Belum ada item.</p>
            )}
          </div>
        </div>

        {/* Total Harga */}
        <div className="flex justify-between text-lg font-semibold mb-4">
          <p>Total:</p>
          <p>Rp {totalHarga.toLocaleString()}</p>
        </div>

        {/* Nama Meja */}
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Nama Meja:</span>{" "}
            {orderData.namaMeja}
          </p>
        </div>

        {/* Tombol Konfirmasi */}
        <button
          onClick={handleConfirm}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
        >
          Konfirmasi Pesanan
        </button>
      </div>
    </div>
  );
}
