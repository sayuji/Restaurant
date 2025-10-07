import MainLayout from "../layouts/MainLayout";

export default function Dashboard() {
  return (
    <MainLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500 text-sm">Penjualan Hari Ini</p>
          <h3 className="text-xl font-bold mt-2">Rp 2.500.000</h3>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <h3 className="text-xl font-bold mt-2">120</h3>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500 text-sm">Meja Terisi</p>
          <h3 className="text-xl font-bold mt-2">15/20</h3>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-gray-500 text-sm">Menu Terlaris</p>
          <h3 className="text-xl font-bold mt-2">Nasi Goreng</h3>
        </div>
      </div>

      {/* Grafik Dummy */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Statistik Penjualan</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          [Grafik Penjualan Dummy]
        </div>
      </div>
    </MainLayout>
  );
}
