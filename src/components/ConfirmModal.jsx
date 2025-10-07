export default function ConfirmModal({ show, onClose, onConfirm, message }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Konfirmasi</h3>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded border"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={onConfirm}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
