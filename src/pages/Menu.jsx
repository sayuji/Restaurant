import { useState, useMemo, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import Select from "react-select";

export default function Menu() {
  const [categories, setCategories] = useState([
    { value: "Makanan", label: "Makanan" },
    { value: "Minuman", label: "Minuman" },
  ]);

  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    price: "",
    description: "",
    category: null,
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ✅ Load menu dari localStorage SEKALI SAJA di awal
  useEffect(() => {
    const savedMenus = localStorage.getItem("menus");
    if (savedMenus) {
      setMenus(JSON.parse(savedMenus));
    }
  }, []);

  // ✅ Simpan otomatis ke localStorage setiap kali menus berubah
  useEffect(() => {
    if (menus.length > 0) {
      localStorage.setItem("menus", JSON.stringify(menus));
    }
  }, [menus]);

  const filteredMenus = useMemo(() => {
    return menus.filter(
      (menu) =>
        menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.category?.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menus, searchTerm]);

  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const paginatedMenus = filteredMenus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.find((c) => c.value === newCategory)) {
      const newCat = { value: newCategory, label: newCategory };
      setCategories([...categories, newCat]);
      setForm({ ...form, category: newCat });
      setNewCategory("");
      setShowCategoryModal(false);
    }
  };

  // ✅ Convert gambar ke base64 (biar tetap muncul setelah reload)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleAddMenu = (e) => {
    e.preventDefault();
    let tempErrors = {};
    let hasError = false;

    if (!form.name) {
      tempErrors.name = "Nama menu wajib diisi";
      hasError = true;
    }
    if (!form.price) {
      tempErrors.price = "Harga wajib diisi";
      hasError = true;
    }
    if (!form.description) {
      tempErrors.description = "Deskripsi wajib diisi";
      hasError = true;
    }
    if (!form.category) {
      tempErrors.category = "Kategori wajib dipilih";
      hasError = true;
    }
    if (!form.image) {
      tempErrors.image = "Gambar wajib diupload";
      hasError = true;
    }

    setErrors(tempErrors);
    if (hasError) return;

    if (form.id) {
      setMenus(menus.map((m) => (m.id === form.id ? form : m)));
    } else {
      setMenus([...menus, { ...form, id: Date.now() }]);
    }

    setForm({
      id: null,
      name: "",
      price: "",
      description: "",
      category: null,
      image: null,
    });
    setErrors({});
  };

  const handleEditMenu = (menu) => {
    setForm(menu);
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm("Yakin ingin menghapus menu ini?")) {
      const updated = menus.filter((m) => m.id !== id);
      setMenus(updated);
      localStorage.setItem("menus", JSON.stringify(updated)); // ✅ langsung update storage
    }
  };

  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6">Manajemen Menu</h2>

      {/* Form Tambah/Edit Menu */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {form.id ? "Edit Menu" : "Tambah Menu"}
        </h3>
        <form
          onSubmit={handleAddMenu}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="flex flex-col">
            <input
              type="text"
              placeholder="Nama Menu"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`border rounded px-3 py-2 ${
                errors.name ? "border-red-500" : ""
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col">
            <input
              type="number"
              placeholder="Harga"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={`border rounded px-3 py-2 ${
                errors.price ? "border-red-500" : ""
              }`}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div className="flex flex-col md:col-span-2">
            <textarea
              placeholder="Deskripsi"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={`border rounded px-3 py-2 ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description}
              </p>
            )}
          </div>

          <div className="flex flex-col md:col-span-2">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">{errors.image}</p>
            )}
            {form.image && (
              <img
                src={form.image}
                alt="Preview"
                className="w-32 h-32 object-cover mt-2 rounded"
              />
            )}
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <div className="flex-1 flex flex-col">
              <Select
                options={categories}
                value={form.category}
                onChange={(selected) =>
                  setForm({ ...form, category: selected })
                }
                placeholder="Pilih kategori"
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
            >
              + Add
            </button>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 md:col-span-2"
          >
            {form.id ? "Simpan Perubahan" : "Tambah Menu"}
          </button>
        </form>
      </div>

      {/* Tabel Daftar Menu */}
      <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Gambar</th>
              <th className="border px-3 py-2">Nama</th>
              <th className="border px-3 py-2">Harga</th>
              <th className="border px-3 py-2">Kategori</th>
              <th className="border px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMenus.map((menu) => (
              <tr key={menu.id}>
                <td className="border px-3 py-2 items-center">
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                </td>
                <td className="border px-3 py-2">{menu.name}</td>
                <td className="border px-3 py-2">Rp {menu.price}</td>
                <td className="border px-3 py-2">{menu.category?.label}</td>
                <td className="border px-3 py-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
