import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Orders() {
  const navigate = useNavigate();

  const [categories] = useState([
    { value: "all", label: "Semua Menu" },
    { value: "Makanan", label: "Makanan" },
    { value: "Minuman", label: "Minuman" },
  ]);

  const [menus] = useState([
    {
      id: 1,
      name: "Nasi Goreng",
      price: 20000,
      category: { value: "Makanan", label: "Makanan" },
      image: "/assets/nasigoreng.jpg",
    },
    {
      id: 2,
      name: "Es Teh",
      price: 5000,
      category: { value: "Minuman", label: "Minuman" },
      image: "/assets/esteh.jpg",
    },
    {
      id: 3,
      name: "Mie Ayam",
      price: 18000,
      category: { value: "Makanan", label: "Makanan" },
      image: "/assets/mieayam.jpg",
    },
    {
      id: 4,
      name: "Jus Jeruk",
      price: 12000,
      category: { value: "Minuman", label: "Minuman" },
      image: "/assets/jusjeruk.jpg",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      const matchCategory =
        selectedCategory === "all" || menu.category.value === selectedCategory;
      const matchSearch = menu.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menus, selectedCategory, searchTerm]);

  const addToOrder = (menu, qty = 1, note = "") => {
    const exist = orderItems.find((item) => item.id === menu.id);
    if (exist) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                notes: note || item.notes,
              }
            : item
        )
      );
    } else {
      setOrderItems([...orderItems, { ...menu, quantity: qty, notes: note }]);
    }
  };

  const removeFromOrder = (id) => {
    setOrderItems(orderItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setOrderItems(
      orderItems.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = () => {
    if (orderItems.length === 0) return;

    // Simpan juga ke localStorage biar aman kalau user refresh di checkout
    const orderData = {
      items: orderItems.map((item) => ({
        nama: item.name,
        qty: item.quantity,
        harga: item.price,
        catatan: item.notes,
      })),
      totalHarga: totalPrice,
      namaMeja: "Meja 1",
    };

    localStorage.setItem("orderData", JSON.stringify(orderData));
    navigate("/checkout", { state: orderData });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
          Order - Meja 1
        </h1>
      </header>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <select
          className="border rounded px-3 py-2 w-full md:w-48"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Cari menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-2 w-full md:flex-1"
        />
      </div>

      {/* Menu List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-24">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 flex flex-col"
          >
            <img
              src={menu.image}
              alt={menu.name}
              className="w-full h-32 object-cover rounded-t-lg"
            />
            <div className="p-4 flex flex-col justify-between flex-grow">
              <div>
                <h3 className="font-semibold text-lg">{menu.name}</h3>
                <p className="text-gray-500 text-sm">{menu.category.label}</p>
                <p className="mt-2 font-bold">Rp {menu.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedMenu(menu);
                  setShowModal(true);
                }}
                className="mt-4 bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 transition-all duration-200"
              >
                Tambah
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-t-xl shadow-lg p-4 fixed bottom-0 left-0 right-0 md:relative md:max-w-md md:mx-auto">
        <h2 className="font-semibold text-lg mb-2">Ringkasan Order</h2>
        {orderItems.length === 0 ? (
          <p className="text-gray-500">Belum ada menu ditambahkan.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-gray-500 text-sm">
                    Rp {item.price.toLocaleString()} x {item.quantity}
                  </p>
                  {item.notes && (
                    <p className="text-xs italic text-gray-400">
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    onChange={(e) =>
                      updateQuantity(item.id, parseInt(e.target.value))
                    }
                    className="w-12 border rounded px-2 py-1 text-center"
                  />
                  <button
                    onClick={() => removeFromOrder(item.id)}
                    className="text-red-600 font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-between items-center font-bold">
          <span>Total:</span>
          <span>Rp {totalPrice.toLocaleString()}</span>
        </div>
        <button
          onClick={handleCheckout}
          className="mt-3 w-full bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
        >
          Checkout
        </button>
      </div>

      {/* Modal Tambah Pesanan */}
      {showModal && selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 relative">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {selectedMenu.name}
            </h2>

            {/* Tombol Jumlah */}
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-10 h-10 rounded-l text-lg"
              >
                −
              </button>
              <div className="w-16 text-center border-t border-b py-2 font-semibold text-lg">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold w-10 h-10 rounded-r text-lg"
              >
                +
              </button>
            </div>

            {/* Catatan */}
            <label className="block mb-2 text-sm font-medium text-gray-600">
              Catatan (Opsional):
            </label>
            <textarea
              placeholder="Contoh: pedas, tanpa es, dsb."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            ></textarea>

            {/* Tombol Aksi */}
            <div className="flex justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 w-full mr-2"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  addToOrder(selectedMenu, quantity, notes);
                  setShowModal(false);
                  setQuantity(1);
                  setNotes("");
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full ml-2"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
