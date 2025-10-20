export default function CategoryModal({ show, onClose, newCategory, setNewCategory, onSave }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white dark:bg-gray-800 dark:text-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Tambah Kategori</h3>
        <form onSubmit={onSave} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nama Kategori"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border dark:border-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
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
  );
}
