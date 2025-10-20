import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "../context/ThemeContext"; // ✅ Ambil theme dari context

export default function Dashboard() {
  const { theme } = useTheme(); // ✅ Dapatkan tema aktif (light/dark)

  const [todaySales, setTodaySales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  const [popularMenu, setPopularMenu] = useState("-");
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];
    const progressOrders = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];

    // 1️⃣ Penjualan Hari Ini
    const today = new Date().toLocaleDateString("id-ID");
    const todayOrders = doneOrders.filter((o) => o.tanggal === today);
    const totalTodaySales = todayOrders.reduce(
      (sum, o) => sum + (o.totalHarga || 0),
      0
    );
    setTodaySales(totalTodaySales);

    // 2️⃣ Total Orders
    setTotalOrders(doneOrders.length);

    // 3️⃣ Meja Terisi
    setActiveTables(progressOrders.length);

    // 4️⃣ Menu Terlaris
    const itemCount = {};
    doneOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCount[item.nama] = (itemCount[item.nama] || 0) + item.qty;
      });
    });
    const mostPopular =
      Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    setPopularMenu(mostPopular);

    // 5️⃣ Data Penjualan Mingguan
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const weekSales = days.map((day, index) => {
      const dayOrders = doneOrders.filter((o) => {
        const d = new Date(o.waktuFull || o.tanggal);
        return d.getDay() === index;
      });
      const totalSales = dayOrders.reduce((sum, o) => sum + o.totalHarga, 0);
      return { day, sales: totalSales };
    });
    setWeeklyData(weekSales);
  }, []);

  return (
    <div className="transition-all duration-300">
      <h2 className="text-3xl font-bold mb-8 text-green-700 dark:text-green-400">
        Dashboard Overview 🍽️
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: "Penjualan Hari Ini",
            value: `Rp ${todaySales.toLocaleString()}`,
            color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
          },
          {
            label: "Total Orders",
            value: totalOrders,
            color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
          },
          {
            label: "Meja Terisi",
            value: `${activeTables}`,
            color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
          },
          {
            label: "Menu Terlaris",
            value: popularMenu,
            color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            className={`shadow rounded-xl p-5 transition-all duration-300 ${card.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
            <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Grafik Penjualan Mingguan */}
      <motion.div
        className={`shadow rounded-xl p-6 transition-all duration-300 ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">
          Statistik Penjualan Mingguan
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme === "dark" ? "#444" : "#ccc"}
            />
            <XAxis
              dataKey="day"
              stroke={theme === "dark" ? "#ddd" : "#333"}
            />
            <YAxis
              stroke={theme === "dark" ? "#ddd" : "#333"}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                borderColor: theme === "dark" ? "#374151" : "#ccc",
                color: theme === "dark" ? "#f3f4f6" : "#111",
              }}
              formatter={(value) => `Rp ${value.toLocaleString()}`}
            />
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
