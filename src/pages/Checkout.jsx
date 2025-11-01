import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTheme } from "../context/ThemeContext";
import { ordersAPI, tablesAPI } from '../services/api';

export default function Checkout() {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

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

  // 🔥 FUNGSI KONFIRMASI PESANAN - INTEGRASI DATABASE
  const handleConfirm = async () => {
    if (!orderData) return;
    
    setLoading(true);

    try {
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
        console.log('🔄 Processing order confirmation...', orderData);

        // 🔥 BUAT ORDER DI DATABASE
        const orderPayload = {
          tableId: orderData.tableId,
          tableName: orderData.tableName || orderData.namaMeja,
          items: orderData.items,
          totalHarga: totalHarga,
          paymentMethod: paymentMethod,
          status: "pending"
        };

        // ✅ CREATE ORDER DI DATABASE
        const orderResponse = await ordersAPI.create(orderPayload);
        
        if (orderResponse.success) {
          console.log('✅ Order created in database:', orderResponse.orderId);

          // 🔥 UPDATE TABLE STATUS DI DATABASE
          await tablesAPI.updateStatus(orderData.tableId, 'terisi');
          console.log('✅ Table status updated to "terisi"');

          // 🔥 SIMPAN KE LOCALSTORAGE SEBAGAI BACKUP & UNTUK TV DISPLAY
          const existingOrders = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
          
          const newOrder = {
            id: orderResponse.orderId,
            ...orderData,
            totalHarga,
            paymentMethod,
            waktu: new Date().toLocaleTimeString(),
            tanggal: new Date().toLocaleDateString(),
            status: "Sedang Diproses",
            databaseId: orderResponse.orderId // Simpan ID dari database
          };

          existingOrders.push(newOrder);
          localStorage.setItem("ordersOnProgress", JSON.stringify(existingOrders));

          // 🔥 HAPUS DATA SEMENTARA
          localStorage.removeItem("orderData");
          localStorage.removeItem("currentOrder");

          // 🔥 NOTIFIKASI SUKSES
          await Swal.fire({
            title: "Berhasil!",
            text: "Pesanan berhasil dikonfirmasi 🎉",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 2000,
            showConfirmButton: false,
          });

          // 🔥 REDIRECT KE HALAMAN UTAMA
          setTimeout(() => navigate("/"), 2000);
        }
      }
    } catch (error) {
      console.error('❌ Error confirming order:', error);
      
      // 🔥 FALLBACK KE LOCALSTORAGE JIKA DATABASE ERROR
      await Swal.fire({
        title: "Peringatan!",
        html: `
          <div class="text-left">
            <p class="mb-2">Gagal menyimpan ke database.</p>
            <p class="text-sm text-gray-600">Menggunakan penyimpanan lokal sebagai cadangan.</p>
          </div>
        `,
        icon: "warning",
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "Lanjutkan dengan Local Storage",
      });

      // Fallback ke localStorage
      const existingOrders = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
      
      const newOrder = {
        id: Date.now(),
        ...orderData,
        totalHarga,
        paymentMethod,
        waktu: new Date().toLocaleTimeString(),
        tanggal: new Date().toLocaleDateString(),
        status: "Sedang Diproses",
      };

      existingOrders.push(newOrder);
      localStorage.setItem("ordersOnProgress", JSON.stringify(existingOrders));
      localStorage.removeItem("orderData");
      localStorage.removeItem("currentOrder");

      // Update table status di localStorage
      const tables = JSON.parse(localStorage.getItem("tables")) || [];
      const updatedTables = tables.map(t => 
        t.id === orderData.tableId ? { ...t, status: "terisi" } : t
      );
      localStorage.setItem("tables", JSON.stringify(updatedTables));

      setTimeout(() => navigate("/"), 2000);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Hitung total harga
  const totalHarga = orderData?.items?.reduce((acc, item) => acc + item.harga * item.qty, 0) || 0;

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Memproses pesanan...
          </p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className={`min-h-screen flex justify-center items-center transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tidak ada data pesanan.</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 px-4 transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>Checkout Pesanan</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Konfirmasi pesanan Anda sebelum melanjutkan
          </p>
        </div>

        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
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
            <div className={`rounded-lg p-4 mb-6 transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
                }`}>
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Nama Meja</p>
                  <p className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>{orderData.tableName || orderData.namaMeja}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>Daftar Pesanan</h3>
              <div className="space-y-3">
                {orderData.items.length > 0 ? (
                  orderData.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-start p-4 rounded-lg border-l-4 border-blue-500 transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>{item.nama}</h4>
                        <div className="flex items-center mt-1">
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            theme === 'dark' 
                              ? 'text-gray-300 bg-gray-600' 
                              : 'text-gray-600 bg-white'
                          }`}>
                            Qty: {item.qty}
                          </span>
                          <span className={`text-sm ml-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            @ Rp {item.harga.toLocaleString()}
                          </span>
                        </div>
                        {item.catatan && (
                          <div className={`mt-2 p-2 rounded border-l-2 transition-colors duration-300 ${
                            theme === 'dark' 
                              ? 'bg-yellow-900 border-yellow-600' 
                              : 'bg-yellow-50 border-yellow-400'
                          }`}>
                            <p className={`text-sm italic ${
                              theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'
                            }`}>
                              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              "{item.catatan}"
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold text-lg ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          Rp {(item.harga * item.qty).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`italic text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>Belum ada item.</p>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>Metode Pembayaran</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cash Option */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'cash' 
                      ? theme === 'dark'
                        ? 'border-green-500 bg-green-900'
                        : 'border-green-500 bg-green-50'
                      : theme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      paymentMethod === 'cash' 
                        ? 'border-green-500 bg-green-500' 
                        : theme === 'dark'
                          ? 'border-gray-500'
                          : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cash' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        theme === 'dark' ? 'bg-green-800' : 'bg-green-100'
                      }`}>
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>Tunai</p>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Bayar langsung dengan uang tunai</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QRIS Option */}
                <div 
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'qris' 
                      ? theme === 'dark'
                        ? 'border-blue-500 bg-blue-900'
                        : 'border-blue-500 bg-blue-50'
                      : theme === 'dark'
                        ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('qris')}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      paymentMethod === 'qris' 
                        ? 'border-blue-500 bg-blue-500' 
                        : theme === 'dark'
                          ? 'border-gray-500'
                          : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'qris' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100'
                      }`}>
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>QRIS</p>
                        <p className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>Scan QR code untuk pembayaran</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className={`rounded-lg p-6 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-600' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>Subtotal:</span>
                  <span className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>Rp {totalHarga.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-lg ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>Pajak & Layanan:</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">Gratis</span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>Total:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Rp {totalHarga.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => navigate(-1)}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Kembali
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-2 py-3 px-8 rounded-lg font-semibold shadow-lg transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transform hover:-translate-y-0.5 hover:shadow-xl'
                } text-white`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Konfirmasi Pesanan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}