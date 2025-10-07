export default function MenuList({ menus, onEdit, onDelete }) {
  return (
    <table className="w-full border-collapse border">
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
        {menus.map((menu) => (
          <tr key={menu.id}>
            <td className="border px-4 py-2">{menu.name}</td>
            <td className="border px-4 py-2">Rp {menu.price}</td>
            <td className="border px-4 py-2">{menu.description}</td>
            <td className="border px-4 py-2">{menu.category?.label}</td>
            <td className="border px-4 py-2 flex gap-2">
              <button
                className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500"
                onClick={() => onEdit(menu)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                onClick={() => onDelete(menu.id)}
              >
                Hapus
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
