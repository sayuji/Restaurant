import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { QRCodeCanvas } from "qrcode.react";

export default function Tables() {
  const [tables, setTables] = useState([
    { id: 1, name: "Meja 1", status: "kosong" },
    { id: 2, name: "Meja 2", status: "terisi" },
    { id: 3, name: "Meja 3", status: "kosong" },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [form, setForm] = useState({ name: "", status: "kosong" });

  const openModal = (type, table = {}) => {
    setModalData({ ...table, type });
    if (type === "edit") {
      setForm({ name: table.name, status: table.status });
    } else if (type === "add") {
      setForm({ name: "", status: "kosong" });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: "", status: "kosong" });
  };

  const handleAddTable = () => {
    if (!form.name) return alert("Isi nama meja dulu!");
    const newTable = {
      id: tables.length ? tables[tables.length - 1].id + 1 : 1,
      name: form.name,
      status: form.status,
    };
    setTables([...tables, newTable]);
    closeModal();
  };

  const handleEditTable = () => {
    if (!form.name) return alert("Nama meja tidak boleh kosong!");
    setTables(
      tables.map((t) =>
        t.id === modalData.id ? { ...t, name: form.name, status: form.status } : t
      )
    );
    closeModal();
  };

  const handleDeleteTable = () => {
    setTables(tables.filter((t) => t.id !== modalData.id));
    closeModal();
  };

  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6">Manajemen Meja</h2>

      <button
        onClick={() => openModal("add")}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
      >
        + Tambah Meja
      </button>

      <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Nama Meja</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">QR Code</th>
              <th className="border px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="text-center">
                <td className="border px-4 py-2">{table.name}</td>
                <td className="border px-4 py-2">{table.status}</td>

                {/* QR Code */}
                <td className="border px-4 py-2">
                  <div className="flex justify-center">
                    <QRCodeCanvas
                      value={`https://restaurant.com/order?table=${table.id}`}
                      size={64}
                      className={table.status === "kosong" ? "opacity-100" : "opacity-40"}
                    />
                  </div>
                </td>

                {/* Aksi */}
                <td className="border px-4 py-2">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openModal("edit", table)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openModal("delete", table)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            {modalData.type === "delete" ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Hapus Meja</h3>
                <p>Yakin ingin menghapus meja "{modalData.name}"?</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded border"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteTable}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">
                  {modalData.id ? "Edit Meja" : "Tambah Meja"}
                </h3>
                <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Nama Meja"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border rounded px-3 py-2"
                  />
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="border rounded px-3 py-2"
                  >
                    <option value="kosong">Kosong</option>
                    <option value="terisi">Terisi</option>
                  </select>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded border"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={modalData.id ? handleEditTable : handleAddTable}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {modalData.id ? "Simpan" : "Tambah"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
