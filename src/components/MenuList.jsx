import { useTheme } from "../context/ThemeContext";
import { Edit3, Trash2, Image as ImageIcon } from "lucide-react";

export default function MenuList({ 
  menus = [], 
  onEdit = () => {}, 
  onDelete = () => {},
  viewMode = "grid",
  getImageSrc
}) {
  const { theme } = useTheme();

  // Jika viewMode = "grid"
  if (viewMode === "grid") {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menus.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                Belum ada menu
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Tambahkan menu pertama Anda
              </p>
            </div>
          ) : (
            menus.map((menu) => (
              <div
                key={menu.id}
                className={`rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}
              >
                {/* Image */}
                <div className="relative">
                  {getImageSrc && getImageSrc(menu.image) ? (
                    <img
                      src={getImageSrc(menu.image)}
                      alt={menu.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  {menu.category && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                      {menu.category.label}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className={`font-semibold text-lg mb-1 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {menu.name}
                  </h3>
                  
                  <p className={`text-sm mb-3 line-clamp-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {menu.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-lg ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(menu)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        title="Edit Menu"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(menu.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Jika viewMode = "list" (table view)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border dark:border-gray-600">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="border px-4 py-3 dark:border-gray-600 dark:text-white text-left">Gambar</th>
            <th className="border px-4 py-3 dark:border-gray-600 dark:text-white text-left">Nama</th>
            <th className="border px-4 py-3 dark:border-gray-600 dark:text-white text-left">Harga</th>
            <th className="border px-4 py-3 dark:border-gray-600 dark:text-white text-left">Kategori</th>
            <th className="border px-4 py-3 dark:border-gray-600 dark:text-white text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {menus.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>Belum ada menu.</p>
              </td>
            </tr>
          ) : (
            menus.map((menu) => (
              <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border px-4 py-3 dark:border-gray-600">
                  {getImageSrc && getImageSrc(menu.image) ? (
                    <img
                      src={getImageSrc(menu.image)}
                      alt={menu.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center text-sm text-gray-400 dark:text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </td>
                <td className="border px-4 py-3 dark:border-gray-600 dark:text-white font-medium">
                  {menu.name}
                </td>
                <td className="border px-4 py-3 dark:border-gray-600 dark:text-white">
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Rp {menu.price.toLocaleString('id-ID')}
                  </span>
                </td>
                <td className="border px-4 py-3 dark:border-gray-600 dark:text-white">
                  {menu.category?.label && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {menu.category.label}
                    </span>
                  )}
                </td>
                <td className="border px-4 py-3 dark:border-gray-600">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(menu)}
                      className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(menu.id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}