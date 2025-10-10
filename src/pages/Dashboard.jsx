import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  // Data dummy untuk grafik penjualan
  const data = [
    { day: "Senin", sales: 2500000 },
    { day: "Selasa", sales: 3200000 },
    { day: "Rabu", sales: 2800000 },
    { day: "Kamis", sales: 4000000 },
    { day: "Jumat", sales: 3800000 },
    { day: "Sabtu", sales: 5000000 },
    { day: "Minggu", sales: 4700000 },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-green-700">
        Dashboard Overview 🍽️
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Penjualan Hari Ini", value: "Rp 2.500.000", color: "bg-green-100 text-green-700" },
          { label: "Total Orders", value: "120", color: "bg-blue-100 text-blue-700" },
          { label: "Meja Terisi", value: "15/20", color: "bg-yellow-100 text-yellow-700" },
          { label: "Menu Terlaris", value: "Nasi Goreng", color: "bg-red-100 text-red-700" },
        ].map((card, index) => (
          <motion.div
            key={index}
            className={`shadow rounded-xl p-5 ${card.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <p className="text-sm text-gray-600">{card.label}</p>
            <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Grafik Penjualan */}
      <motion.div
        className="bg-white shadow rounded-xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Statistik Penjualan Mingguan
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#16a34a"
              strokeWidth={3}
              dot={{ r: 6, fill: "#16a34a" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
