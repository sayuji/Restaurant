import { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import CategoryModal from "../components/CategoryModal";
import ConfirmModal from "../components/ConfirmModal";
import MenuList from "../components/MenuList";
import { useTheme } from "../context/ThemeContext"; // ✅ Gunakan tema

export default function Menu() {
  const { theme } = useTheme(); // ✅ Ambil tema aktif (light/dark)

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);

  const itemsPerPage = 5;

  useEffect(() => {
    try {
      const savedMenus = JSON.parse(localStorage.getItem("menus") || "[]");
      const savedCategories = JSON.parse(localStorage.getItem("categories") || "[]");

      if (Array.isArray(savedMenus) && savedMenus.length > 0) {
        setMenus(savedMenus);
      }

      if (Array.isArray(savedCategories) && savedCategories.length > 0) {
        setCategories(savedCategories);
      }
    } catch (error) {
      console.error("Gagal membaca localStorage:", error);
    }
  }, []);

  useEffect(() => {
    if (menus.length >= 0) {
      localStorage.setItem("menus", JSON.stringify(menus));
    }
  }, [menus]);

  useEffect(() => {
    if (categories.length >= 0) {
      localStorage.setItem("categories", JSON.stringify(categories));
    }
  }, [categories]);

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
    if (
      newCategory.trim() &&
      !categories.find((c) => c.value === newCategory)
    ) {
      const newCat = { value: newCategory, label: newCategory };
      const updatedCategories = [...categories, newCat];
      setCategories(updatedCategories);
      setForm({ ...form, category: newCat });
      setNewCategory("");
      setShowCategoryModal(false);
      localStorage.setItem("categories", JSON.stringify(updatedCategories));
    }
  };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteMenu = (id) => {
    setMenuToDelete(id);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    const updated = menus.filter((m) => m.id !== menuToDelete);
    setMenus(updated);
    localStorage.setItem("menus", JSON.stringify(updated));
    setShowConfirm(false);
    setMenuToDelete(null);
  };

  return (
    <div className="p-4 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">📋 Manajemen Menu</h2>

      {/* Form Tambah/Edit Menu */}
      <div className="bg-white dark:bg-gray-800 dark:text-white shadow rounded-lg p-6 mb-6">
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
              className={`border rounded px-3 py-2 dark:bg-gray-700 dark:text-white ${
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
              className={`border rounded px-3 py-2 dark:bg-gray-700 dark:text-white ${
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
              className={`border rounded px-3 py-2 dark:bg-gray-700 dark:text-white ${
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
                className="text-black dark:text-white"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: theme === "dark" ? "#374151" : "white",
                    borderColor: theme === "dark" ? "#4b5563" : "#ccc",
                    color: theme === "dark" ? "white" : "black",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: theme === "dark" ? "#1f2937" : "white",
                    color: theme === "dark" ? "white" : "black",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: theme === "dark" ? "white" : "black",
                  }),
                }}
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

      {/* Tabel Menu List */}
      <div className="bg-white dark:bg-gray-800 dark:text-white shadow rounded-lg p-6 overflow-x-auto">
        <MenuList
          menus={paginatedMenus}
          onEdit={handleEditMenu}
          onDelete={handleDeleteMenu}
        />

        {/* Pagination Control */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal Tambah Kategori */}
      <CategoryModal
        show={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onSave={handleAddCategory}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        message="Yakin ingin menghapus menu ini?"
      />
    </div>
  );
}
