import { useState, useMemo, useEffect } from "react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Upload, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  FileText,
  Grid,
  List
} from "lucide-react";
import CategoryModal from "../components/CategoryModal";
import ConfirmModal from "../components/ConfirmModal";
import MenuList from "../components/MenuList";
import { useTheme } from "../context/ThemeContext";

export default function Menu() {
  const { theme } = useTheme();
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
    isAvailable: true
  });

  const [errors, setErrors] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("name"); // name, price, date

  const itemsPerPage = viewMode === "grid" ? 8 : 10;

  // Load data from localStorage
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

  // Save to localStorage
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

  // Filter and sort menus
  const filteredMenus = useMemo(() => {
    let filtered = menus.filter(menu => {
      const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          menu.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          menu.category?.label.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || menu.category?.value === categoryFilter;
      const matchesAvailability = availabilityFilter === "all" || 
                                (availabilityFilter === "available" && menu.isAvailable !== false) ||
                                (availabilityFilter === "unavailable" && menu.isAvailable === false);
      
      return matchesSearch && matchesCategory && matchesAvailability;
    });

    // Sort menus
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "date":
          return new Date(b.id || 0) - new Date(a.id || 0);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [menus, searchTerm, categoryFilter, availabilityFilter, sortBy]);

  const totalPages = Math.ceil(filteredMenus.length / itemsPerPage);
  const paginatedMenus = filteredMenus.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = useMemo(() => {
    const totalMenus = menus.length;
    const availableMenus = menus.filter(m => m.isAvailable !== false).length;
    const totalCategories = categories.length;
    
    const totalValue = menus.reduce((sum, menu) => sum + (parseInt(menu.price) || 0), 0);
    
    return { totalMenus, availableMenus, totalCategories, totalValue };
  }, [menus, categories]);

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.find((c) => c.value === newCategory)) {
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
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, image: "File harus berupa gambar" });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, image: "Ukuran gambar maksimal 5MB" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image: reader.result });
      setErrors({ ...errors, image: "" });
    };
    reader.readAsDataURL(file);
  };

  const handleAddMenu = (e) => {
    e.preventDefault();
    let tempErrors = {};
    let hasError = false;

    if (!form.name.trim()) {
      tempErrors.name = "Nama menu wajib diisi";
      hasError = true;
    }
    
    if (!form.price || parseInt(form.price) <= 0) {
      tempErrors.price = "Harga wajib diisi dan harus lebih dari 0";
      hasError = true;
    }
    
    if (!form.description.trim()) {
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

    const menuData = {
      ...form,
      price: parseInt(form.price),
      id: form.id || Date.now(),
      createdAt: form.id ? form.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (form.id) {
      setMenus(menus.map((m) => (m.id === form.id ? menuData : m)));
    } else {
      setMenus([...menus, menuData]);
    }

    // Reset form
    setForm({
      id: null,
      name: "",
      price: "",
      description: "",
      category: null,
      image: null,
      isAvailable: true
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

  const toggleAvailability = (id) => {
    setMenus(menus.map(menu => 
      menu.id === id ? { ...menu, isAvailable: !menu.isAvailable } : menu
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              🍽️ Manajemen Menu
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola menu makanan dan minuman restoran Anda
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMenus}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Menu</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.availableMenus}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tersedia</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalCategories}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kategori</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Add/Edit Menu Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl shadow-lg p-6 mb-8 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {form.id ? "✏️ Edit Menu" : "➕ Tambah Menu Baru"}
          </h2>
          {form.id && (
            <button
              onClick={() => setForm({
                id: null,
                name: "",
                price: "",
                description: "",
                category: null,
                image: null,
                isAvailable: true
              })}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Batalkan Edit
            </button>
          )}
        </div>

        <form onSubmit={handleAddMenu} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Menu *
              </label>
              <input
                type="text"
                placeholder="Masukkan nama menu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.name 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-gray-300 dark:border-gray-600'
                } ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-white placeholder-gray-400' 
                    : 'bg-white text-gray-800'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.name}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Harga *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  placeholder="Masukkan harga"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.price 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  } ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-800'
                  }`}
                />
              </div>
              {errors.price && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.price}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kategori *
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    options={categories}
                    value={form.category}
                    onChange={(selected) => setForm({ ...form, category: selected })}
                    placeholder="Pilih kategori..."
                    className="text-black dark:text-white"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: theme === "dark" ? "#374151" : "white",
                        borderColor: errors.category 
                          ? (theme === "dark" ? "#f87171" : "#ef4444")
                          : (state.isFocused 
                            ? (theme === "dark" ? "#3b82f6" : "#3b82f6")
                            : (theme === "dark" ? "#4b5563" : "#d1d5db")),
                        color: theme === "dark" ? "white" : "black",
                        borderRadius: '12px',
                        padding: '2px 8px',
                        boxShadow: state.isFocused ? '0 0 0 2px #3b82f6' : 'none',
                        '&:hover': {
                          borderColor: theme === "dark" ? "#6b7280" : "#9ca3af"
                        }
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: theme === "dark" ? "#374151" : "white",
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected 
                          ? (theme === "dark" ? "#1e40af" : "#3b82f6")
                          : state.isFocused
                          ? (theme === "dark" ? "#4b5563" : "#f3f4f6")
                          : (theme === "dark" ? "#374151" : "white"),
                        color: theme === "dark" ? "white" : "black",
                        '&:hover': {
                          backgroundColor: theme === "dark" ? "#4b5563" : "#f3f4f6"
                        }
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: theme === "dark" ? "white" : "black",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: theme === "dark" ? "#9ca3af" : "#6b7280",
                      }),
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {errors.category && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.category}</p>
              )}
            </div>

            {/* Availability */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tersedia untuk dipesan
                </span>
              </label>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deskripsi *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  placeholder="Deskripsi menu, bahan-bahan, dll."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                    errors.description 
                      ? 'border-red-500 dark:border-red-400' 
                      : 'border-gray-300 dark:border-gray-600'
                  } ${
                    theme === 'dark' 
                      ? 'bg-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white text-gray-800'
                  }`}
                />
              </div>
              {errors.description && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2">{errors.description}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gambar Menu *
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center transition-colors duration-200 hover:border-blue-500 dark:hover:border-blue-400">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {form.image ? (
                    <div className="space-y-3">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto border"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Klik untuk mengganti gambar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Upload Gambar Menu
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG, JPEG (max. 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {errors.image && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-center">{errors.image}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {form.id ? "💾 Simpan Perubahan" : "➕ Tambah Menu"}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl shadow-lg p-6 mb-6 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="all">Semua Status</option>
              <option value="available">Tersedia</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
            >
              <option value="name">Urutkan: Nama</option>
              <option value="price">Urutkan: Harga</option>
              <option value="date">Urutkan: Terbaru</option>
            </select>

            {/* View Toggle */}
            <div className={`flex rounded-xl border overflow-hidden ${
              theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 transition-colors ${
                  viewMode === "grid"
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 transition-colors ${
                  viewMode === "list"
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Menu List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl shadow-lg overflow-hidden transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <MenuList
          menus={paginatedMenus}
          onEdit={handleEditMenu}
          onDelete={handleDeleteMenu}
          onToggleAvailability={toggleAvailability}
          viewMode={viewMode}
        />

        {/* Empty State */}
        {filteredMenus.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Tidak ada menu yang ditemukan
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Coba ubah filter pencarian atau tambahkan menu baru
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Menampilkan {paginatedMenus.length} dari {filteredMenus.length} menu
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                  }`}
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-lg border font-medium transition-colors ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <CategoryModal
        show={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        onSave={handleAddCategory}
      />

      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        message="Yakin ingin menghapus menu ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}