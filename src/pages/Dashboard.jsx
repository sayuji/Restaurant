import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Utensils,
  DollarSign,
  Clock,
  ChefHat,
  Coffee
} from "lucide-react";

export default function Dashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalOrders: 0,
    activeTables: 0,
    popularMenu: "-",
    avgOrderValue: 0,
    completionTime: "0 min",
    kitchenPerformance: "0%"
  });

  const [weeklyData, setWeeklyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [timeRange, setTimeRange] = useState("week"); // week, month, year

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    const updateDashboard = () => {
      const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];
      const progressOrders = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
      const tables = JSON.parse(localStorage.getItem("tables")) || [];
      const menus = JSON.parse(localStorage.getItem("menus")) || [];

      const today = new Date().toLocaleDateString("id-ID");
      
      // Today's orders
      const todayOrders = doneOrders.filter((o) => o.tanggal === today);
      const totalTodaySales = todayOrders.reduce((sum, o) => sum + (o.totalHarga || 0), 0);
      
      // Average Order Value
      const avgOrderValue = doneOrders.length > 0 
        ? Math.round(doneOrders.reduce((sum, o) => sum + o.totalHarga, 0) / doneOrders.length)
        : 0;

      // Popular Menu with quantity
      const itemCount = {};
      doneOrders.forEach((order) => {
        order.items.forEach((item) => {
          itemCount[item.nama] = (itemCount[item.nama] || 0) + item.qty;
        });
      });
      
      const mostPopular = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];
      const popularMenu = mostPopular ? `${mostPopular[0]} (${mostPopular[1]}x)` : "-";

      // Category Sales Data
      const categorySales = {};
      doneOrders.forEach((order) => {
        order.items.forEach((item) => {
          const menuItem = menus.find(m => m.name === item.nama);
          const category = menuItem?.category?.label || "Lainnya";
          categorySales[category] = (categorySales[category] || 0) + (item.harga * item.qty);
        });
      });
      
      const categoryChartData = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value
      }));

      // Weekly/Monthly Data based on timeRange
      const getTimeRangeData = () => {
        if (timeRange === "week") {
          const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          return days.map((day, index) => {
            const dayOrders = doneOrders.filter((o) => {
              const d = new Date(o.waktuFull || o.tanggal);
              return d.getDay() === index;
            });
            const totalSales = dayOrders.reduce((sum, o) => sum + o.totalHarga, 0);
            return { day, sales: totalSales, orders: dayOrders.length };
          });
        } else if (timeRange === "month") {
          // Last 30 days
          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          });
          
          return last30Days.map(date => {
            const dayOrders = doneOrders.filter(o => o.tanggal === date);
            const totalSales = dayOrders.reduce((sum, o) => sum + o.totalHarga, 0);
            return { day: date, sales: totalSales, orders: dayOrders.length };
          });
        } else {
          // Yearly - last 12 months
          const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
          return months.map(month => {
            const monthOrders = doneOrders.filter(o => {
              const orderDate = new Date(o.waktuFull || o.tanggal);
              return orderDate.toLocaleDateString("id-ID", { month: "short" }) === month;
            });
            const totalSales = monthOrders.reduce((sum, o) => sum + o.totalHarga, 0);
            return { day: month, sales: totalSales, orders: monthOrders.length };
          });
        }
      };

      // Recent Orders (last 5)
      const recentOrdersData = [...doneOrders]
        .sort((a, b) => new Date(b.waktuFull || b.tanggal) - new Date(a.waktuFull || a.tanggal))
        .slice(0, 5);

      setStats({
        todaySales: totalTodaySales,
        totalOrders: doneOrders.length,
        activeTables: progressOrders.length,
        popularMenu,
        avgOrderValue,
        completionTime: "25 min", // Placeholder - bisa dihitung dari order timestamps
        kitchenPerformance: "85%" // Placeholder - bisa dihitung dari order completion time
      });

      setWeeklyData(getTimeRangeData());
      setCategoryData(categoryChartData);
      setRecentOrders(recentOrdersData);
    };

    updateDashboard();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(updateDashboard, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const statsCards = [
    {
      label: "Penjualan Hari Ini",
      value: `Rp ${stats.todaySales.toLocaleString()}`,
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300"
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    {
      label: "Meja Aktif",
      value: `${stats.activeTables}`,
      icon: Users,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      textColor: "text-amber-700 dark:text-amber-300"
    },
    {
      label: "Menu Terlaris",
      value: stats.popularMenu,
      icon: Utensils,
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      textColor: "text-red-700 dark:text-red-300"
    },
    {
      label: "Rata-rata Order",
      value: `Rp ${stats.avgOrderValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      label: "Performa Dapur",
      value: stats.kitchenPerformance,
      icon: ChefHat,
      color: "from-gray-500 to-gray-700",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      textColor: "text-gray-700 dark:text-gray-300"
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6 transition-all duration-300">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Ringkasan performa restoran dan analisis penjualan
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2 mt-4 lg:mt-0">
          {["week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {range === "week" ? "Minggu" : range === "month" ? "Bulan" : "Tahun"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bgColor} rounded-2xl p-6 transition-all duration-300 hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>
                  {card.label}
                </p>
                <h3 className="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className={`rounded-2xl p-6 transition-all duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Statistik Penjualan
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Penjualan</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Orders</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={theme === "dark" ? "#374151" : "#e5e7eb"} 
              />
              <XAxis 
                dataKey="day" 
                stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                fontSize={12}
              />
              <YAxis 
                stroke={theme === "dark" ? "#9ca3af" : "#6b7280"}
                fontSize={12}
                tickFormatter={(value) => `Rp${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                  borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
                  color: theme === "dark" ? "#f3f4f6" : "#111827",
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [
                  name === 'sales' ? formatCurrency(value) : value,
                  name === 'sales' ? 'Penjualan' : 'Orders'
                ]}
              />
              <Bar 
                dataKey="sales" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="sales"
              />
              <Bar 
                dataKey="orders" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]}
                name="orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className={`rounded-2xl p-6 transition-all duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">
            Penjualan per Kategori
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1f2937" : "#fff",
                  borderColor: theme === "dark" ? "#374151" : "#e5e7eb",
                  color: theme === "dark" ? "#f3f4f6" : "#111827",
                  borderRadius: '8px'
                }}
                formatter={(value) => [formatCurrency(value), 'Penjualan']}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Orders & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`rounded-2xl p-6 transition-all duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg lg:col-span-2`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Order Terbaru
          </h3>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {order.namaMeja}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.items.length} items • {order.waktu}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {formatCurrency(order.totalHarga)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Selesai
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Belum ada order</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl p-6 transition-all duration-300 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <span className="text-sm text-blue-700 dark:text-blue-300">Meja Tersedia</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {12 - stats.activeTables}/12
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-sm text-green-700 dark:text-green-300">Order Rate</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {Math.round((stats.totalOrders / 30) * 100)}/hari
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <span className="text-sm text-amber-700 dark:text-amber-300">Waktu Penyajian</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.completionTime}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}