import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");

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
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">Tidak ada data pesanan.</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
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
      html: `
        <div class="text-left">
          <p class="mb-2">Pastikan semua pesanan sudah benar sebelum dikonfirmasi.</p>
          <p class="text-sm text-gray-600">Metode Pembayaran: <strong>${paymentMethod === 'cash' ? 'Tunai' : 'QRIS'}</strong></p>
        </div>
      `,
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
        paymentMethod,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout Pesanan</h1>
          <p className="text-gray-600">Konfirmasi pesanan Anda sebelum melanjutkan</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Order Summary Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Ringkasan Pesanan
            </h2>
          </div>

          <div className="p-6">
            {/* Table Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nama Meja</p>
                  <p className="font-semibold text-gray-800">{orderData.namaMeja}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Daftar Pesanan</h3>
              <div className="space-y-3">
                {orderData.items.length > 0 ? (
                  orderData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.nama}</h4>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                            Qty: {item.qty}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            @ Rp {item.harga.toLocaleString()}
                          </span>
                        </div>
                        {item.catatan && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                            <p className="text-sm text-yellow-800 italic">
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              "{item.catatan}"
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-gray-800">
                          Rp {(item.harga * item.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-center py-8">Belum ada item.</p>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Metode Pembayaran</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash Option */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cash' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Tunai</p>
                        <p className="text-sm text-gray-600">Bayar langsung dengan uang tunai</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QRIS Option */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'qris' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('qris')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      paymentMethod === 'qris' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'qris' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">QRIS</p>
                        <p className="text-sm text-gray-600">Scan QR code untuk pembayaran</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="border-t pt-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-gray-600">Subtotal:</span>
                  <span className="text-lg font-semibold">Rp {totalHarga.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg text-gray-600">Pajak & Layanan:</span>
                  <span className="text-lg font-semibold text-green-600">Gratis</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">Rp {totalHarga.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirm}
                className="flex-2 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-8 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Konfirmasi Pesanan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
