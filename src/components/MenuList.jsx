export default function MenuList({ menus = [], onEdit = () => {}, onDelete = () => {} }) {
  return (
    <div>
      <table className="w-full border dark:border-gray-600">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className="border px-3 py-2 dark:border-gray-600 dark:text-white">Gambar</th>
            <th className="border px-3 py-2 dark:border-gray-600 dark:text-white">Nama</th>
            <th className="border px-3 py-2 dark:border-gray-600 dark:text-white">Harga</th>
            <th className="border px-3 py-2 dark:border-gray-600 dark:text-white">Kategori</th>
            <th className="border px-3 py-2 dark:border-gray-600 dark:text-white">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {menus.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="text-center py-6 text-gray-500 dark:text-gray-400"
              >
                Belum ada menu.
              </td>
            </tr>
          ) : (
            menus.map((menu) => (
              <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border px-3 py-2 dark:border-gray-600">
                  {menu.image ? (
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center text-sm text-gray-400 dark:text-gray-300">
                      No Image
                    </div>
                  )}
                </td>
                <td className="border px-3 py-2 dark:border-gray-600 dark:text-white">{menu.name}</td>
                <td className="border px-3 py-2 dark:border-gray-600 dark:text-white">Rp {menu.price}</td>
                <td className="border px-3 py-2 dark:border-gray-600 dark:text-white">{menu.category?.label}</td>
                <td className="border px-3 py-2 dark:border-gray-600">
                  <button
                    onClick={() => onEdit(menu)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(menu.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
