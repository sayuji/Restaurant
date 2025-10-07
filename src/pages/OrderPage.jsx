import { useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import Select from "react-select";

export default function OrderPage() {
  const [menus, setMenus] = useState([
    { id: 1, name: "Nasi Goreng", price: 20000, category: { value: "Makanan", label: "Makanan" } },
    { id: 2, name: "Es Teh", price: 5000, category: { value: "Minuman", label: "Minuman" } },
    { id: 3, name: "Mie Ayam", price: 18000, category: { value: "Makanan", label: "Makanan" } },
  ]);

  const [orders, setOrders] = useState([]);
  const [table, setTable] = useState({ id: 1, name: "Meja 1" });
  const [categoryFilter, setCategoryFilter] = useState({ value: "all", label: "Semua Menu" });
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null); // untuk alert cantik

  const categories = [
    { value: "all", label: "Semua Menu" },
    { value: "Makanan", label: "Makanan" },
    { value: "Minuman", label: "Minuman" },
  ];

  const filteredMenus = useMemo(() => {
    let result = menus;
    if (categoryFilter.value !== "all") {
      result = result.filter((m) => m.category.value === categoryFilter.value);
    }
    if (searchTerm.trim()) {
      result = result.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [menus, categoryFilter, searchTerm]);

  const addToOrder = (menu) => {
    const exist = orders.find((o) => o.id === menu.id);
    if (exist) {
      setOrders(
        orders.map((o) =>
          o.id === menu.id ? { ...o, quantity: o.quantity + 1 } : o
        )
      );
    } else {
      setOrders([...orders, { ...menu, quantity: 1 }]);
    }
  };

  const removeFromOrder = (menuId) => {
    setOrders(
      orders
        .map((o) =>
          o.id === menuId ? { ...o, quantity: o.quantity - 1 } : o
        )
        .filter((o) => o.quantity > 0)
    );
  };

  const totalPrice = orders.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

  const handleCheckout = () => {
    setToast(`Order untuk ${table.name} berhasil! Total Rp ${totalPrice}`);
    setOrders([]);
    setTimeout(() => setToast(null), 3000); // hilang otomatis 3 detik
  };

  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6 text-center md:text-left">Order - {table.name}</h2>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select
            options={categories}
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
        <input
          type="text"
          placeholder="Cari menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-xl px-4 py-2 flex-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {filteredMenus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold">{menu.name}</h3>
              <p className="text-gray-600 mt-1">Rp {menu.price}</p>
              <p className="text-sm mt-1 text-gray-500">{menu.category.label}</p>
            </div>
            <button
              onClick={() => addToOrder(menu)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
            >
              Tambah
            </button>
          </div>
        ))}
        {filteredMenus.length === 0 && (
          <p className="text-gray-500 col-span-full text-center mt-4">Menu tidak ditemukan</p>
        )}
      </div>

      {/* Order list */}
      <div className="bg-white shadow rounded-xl p-4 sm:p-6 mb-24 sm:mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Pesanan</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500">Belum ada pesanan</p>
        ) : (
          <table className="w-full min-w-[500px] border-collapse border text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 sm:px-4 py-2">Menu</th>
                <th className="border px-2 sm:px-4 py-2">Harga</th>
                <th className="border px-2 sm:px-4 py-2">Qty</th>
                <th className="border px-2 sm:px-4 py-2">Subtotal</th>
                <th className="border px-2 sm:px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="text-center">
                  <td className="border px-2 sm:px-4 py-2">{order.name}</td>
                  <td className="border px-2 sm:px-4 py-2">Rp {order.price}</td>
                  <td className="border px-2 sm:px-4 py-2">{order.quantity}</td>
                  <td className="border px-2 sm:px-4 py-2">Rp {order.price * order.quantity}</td>
                  <td className="border px-2 sm:px-4 py-2">
                    <button
                      onClick={() => removeFromOrder(order.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Kurangi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sticky Total & Checkout untuk HP */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-green-100 to-green-200 p-4 sm:static sm:rounded-xl sm:shadow-lg sm:flex sm:justify-between sm:items-center z-50">
        <div className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-0">
          Total: <span className="text-green-900">Rp {totalPrice}</span>
        </div>
        <button
          disabled={orders.length === 0}
          className="bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl hover:bg-green-700 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCheckout}
        >
          Checkout
        </button>
      </div>

      {/* Toast alert */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fadein">
          {toast}
        </div>
      )}

      <style>
        {`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadein {
            animation: fadein 0.3s ease-out;
          }
        `}
      </style>
    </MainLayout>
  );
}
