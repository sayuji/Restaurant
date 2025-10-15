export default function MenuList({ menus = [], onEdit = () => {}, onDelete = () => {} }) {
  return (
    <div>
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
          {menus.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                Belum ada menu.
              </td>
            </tr>
          ) : (
            menus.map((menu) => (
              <tr key={menu.id}>
                <td className="border px-3 py-2 items-center">
                  {menu.image ? (
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-400">
                      No Image
                    </div>
                  )}
                </td>
                <td className="border px-3 py-2">{menu.name}</td>
                <td className="border px-3 py-2">Rp {menu.price}</td>
                <td className="border px-3 py-2">{menu.category?.label}</td>
                <td className="border px-3 py-2">
                  <button
                    onClick={() => onEdit(menu)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(menu.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
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