import { useState, useMemo } from "react";
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
  });

  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filtered & paginated menus
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

  // Tambah kategori
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

  // Tambah/Edit menu
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

    setErrors(tempErrors);
    if (hasError) return;

    if (form.id) {
      setMenus(menus.map((m) => (m.id === form.id ? form : m)));
    } else {
      setMenus([...menus, { ...form, id: Date.now() }]);
    }

    setForm({ id: null, name: "", price: "", description: "", category: null });
    setErrors({});
  };

  const handleEditMenu = (menu) => {
    setForm(menu);
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm("Yakin ingin menghapus menu ini?")) {
      setMenus(menus.filter((m) => m.id !== id));
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
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`border rounded px-3 py-2 ${
                errors.description ? "border-red-500" : ""
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Dropdown kategori + tombol add */}
          <div className="flex items-center gap-2 md:col-span-2">
            <div className="flex-1 flex flex-col">
              <Select
                options={categories}
                value={form.category}
                onChange={(selected) => setForm({ ...form, category: selected })}
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

      {/* Modal Tambah Kategori */}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Tambah Kategori</h3>
            <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nama Kategori"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="border rounded px-3 py-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari menu atau kategori..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="border rounded px-3 py-2 w-full md:w-full"
        />
      </div>

      {/* Tabel Daftar Menu */}
      <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Daftar Menu</h3>
        <table className="w-full min-w-[600px] border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Nama</th>
              <th className="border px-4 py-2">Harga</th>
              <th className="border px-4 py-2">Deskripsi</th>
              <th className="border px-4 py-2">Kategori</th>
              <th className="border px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMenus.map((menu) => (
              <tr key={menu.id}>
                <td className="border px-4 py-2">{menu.name}</td>
                <td className="border px-4 py-2">Rp {menu.price}</td>
                <td className="border px-4 py-2">{menu.description}</td>
                <td className="border px-4 py-2">{menu.category?.label}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <button
                    onClick={() => handleEditMenu(menu)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMenu(menu.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Hal {currentPage} dari {totalPages || 1}
          </span>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </MainLayout>
  );
}