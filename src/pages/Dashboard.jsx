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
  Coffee,
  Loader
} from "lucide-react";
import { ordersAPI, tablesAPI, menuAPI } from '../services/api';
import toast from "react-hot-toast";

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
  const [timeRange, setTimeRange] = useState("week");
  const [loading, setLoading] = useState(true);

  // Colors for charts
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

  // 🔥 LOAD DATA DARI DATABASE
  useEffect(() => {
    loadDashboardData();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data dari database...');
      
      // Load semua data sekaligus
      const [ordersData, tablesData, menusData] = await Promise.all([
        ordersAPI.getAll().catch(err => {
          console.error('Error loading orders:', err);
          return [];
        }),
        tablesAPI.getAll().catch(err => {
          console.error('Error loading tables:', err);
          return [];
        }),
        menuAPI.getAll().catch(err => {
          console.error('Error loading menus:', err);
          return [];
        })
      ]);

      console.log('📦 Data loaded:', {
        orders: ordersData.length,
        tables: tablesData.length,
        menus: menusData.length
      });

      // Transform orders data
      const allOrders = Array.isArray(ordersData) ? ordersData : [];
      const completedOrders = allOrders.filter(order => 
        order.status === 'completed' || order.status === 'Selesai'
      );
      const activeOrders = allOrders.filter(order => 
        order.status === 'pending' || order.status === 'processing' || order.status === 'Sedang Diproses'
      );

      // Transform tables data
      const allTables = Array.isArray(tablesData) ? tablesData : [];
      const availableTables = allTables.filter(table => table.status === 'kosong');

      // Transform menus data  
      const allMenus = Array.isArray(menusData) ? menusData : [];

      const today = new Date().toLocaleDateString("id-ID");
      
      // Today's orders
      const todayOrders = completedOrders.filter((order) => {
        const orderDate = new Date(order.created_at || order.completedAt).toLocaleDateString("id-ID");
        return orderDate === today;
      });
      
      const totalTodaySales = todayOrders.reduce((sum, order) => sum + (order.total_price || order.totalHarga || 0), 0);
      
      // Average Order Value
      const avgOrderValue = completedOrders.length > 0 
        ? Math.round(completedOrders.reduce((sum, order) => sum + (order.total_price || order.totalHarga || 0), 0) / completedOrders.length)
        : 0;

      // Popular Menu with quantity
      const itemCount = {};
      completedOrders.forEach((order) => {
        let items = [];
        
        // Handle different item formats
        if (Array.isArray(order.items)) {
          items = order.items;
        } else if (typeof order.items === 'string') {
          try {
            items = JSON.parse(order.items);
          } catch (e) {
            console.error('Error parsing items:', e);
            items = [];
          }
        }
        
        items.forEach((item) => {
          const itemName = item.nama || item.menu_name;
          const quantity = item.qty || item.quantity;
          if (itemName && quantity) {
            itemCount[itemName] = (itemCount[itemName] || 0) + quantity;
          }
        });
      });
      
      const mostPopular = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];
      const popularMenu = mostPopular ? `${mostPopular[0]} (${mostPopular[1]}x)` : "-";

      // Category Sales Data
      const categorySales = {};
      completedOrders.forEach((order) => {
        let items = [];
        
        if (Array.isArray(order.items)) {
          items = order.items;
        } else if (typeof order.items === 'string') {
          try {
            items = JSON.parse(order.items);
          } catch (e) {
            items = [];
          }
        }
        
        items.forEach((item) => {
          const itemName = item.nama || item.menu_name;
          const menuItem = allMenus.find(m => m.name === itemName);
          const category = menuItem?.category?.label || menuItem?.category || "Lainnya";
          const price = item.harga || item.price;
          const quantity = item.qty || item.quantity;
          
          if (category && price && quantity) {
            categorySales[category] = (categorySales[category] || 0) + (price * quantity);
          }
        });
      });
      
      const categoryChartData = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value
      }));

      // Time Range Data
      const getTimeRangeData = () => {
        if (timeRange === "week") {
          const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
          return days.map((day, index) => {
            const dayOrders = completedOrders.filter((order) => {
              const orderDate = new Date(order.created_at || order.completedAt);
              return orderDate.getDay() === index;
            });
            const totalSales = dayOrders.reduce((sum, order) => sum + (order.total_price || order.totalHarga || 0), 0);
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
            const dayOrders = completedOrders.filter(order => {
              const orderDate = new Date(order.created_at || order.completedAt).toLocaleDateString("id-ID", { 
                day: "numeric", 
                month: "short" 
              });
              return orderDate === date;
            });
            const totalSales = dayOrders.reduce((sum, order) => sum + (order.total_price || order.totalHarga || 0), 0);
            return { day: date, sales: totalSales, orders: dayOrders.length };
          });
        } else {
          // Yearly - last 12 months
          const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
          return months.map(month => {
            const monthOrders = completedOrders.filter(order => {
              const orderDate = new Date(order.created_at || order.completedAt);
              return orderDate.toLocaleDateString("id-ID", { month: "short" }) === month;
            });
            const totalSales = monthOrders.reduce((sum, order) => sum + (order.total_price || order.totalHarga || 0), 0);
            return { day: month, sales: totalSales, orders: monthOrders.length };
          });
        }
      };

      // Recent Orders (last 5)
      const recentOrdersData = [...completedOrders]
        .sort((a, b) => new Date(b.created_at || b.completedAt) - new Date(a.created_at || a.completedAt))
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          namaMeja: order.table_name,
          items: order.items || [],
          totalHarga: order.total_price || order.totalHarga,
          waktu: new Date(order.created_at || order.completedAt).toLocaleTimeString("id-ID", { hour12: false }),
          tanggal: new Date(order.created_at || order.completedAt).toLocaleDateString("id-ID")
        }));

      // Calculate kitchen performance (placeholder - bisa dikembangkan)
      const totalProcessingTime = completedOrders.length * 25; // Placeholder 25 menit per order
      const kitchenPerformance = completedOrders.length > 0 ? "85%" : "0%";

      setStats({
        todaySales: totalTodaySales,
        totalOrders: completedOrders.length,
        activeTables: activeOrders.length,
        popularMenu,
        avgOrderValue,
        completionTime: "25 min",
        kitchenPerformance
      });

      setWeeklyData(getTimeRangeData());
      setCategoryData(categoryChartData);
      setRecentOrders(recentOrdersData);
      
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
      
      // Fallback ke localStorage
      try {
        const doneOrders = JSON.parse(localStorage.getItem("ordersDone")) || [];
        const progressOrders = JSON.parse(localStorage.getItem("ordersOnProgress")) || [];
        const tables = JSON.parse(localStorage.getItem("tables")) || [];
        const menus = JSON.parse(localStorage.getItem("menus")) || [];

        // ... (fallback logic dari code sebelumnya)
        
      } catch (localError) {
        console.error('❌ Juga gagal baca localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      label: "Penjualan Hari Ini",
      value: `Rp ${stats.todaySales.toLocaleString()}`,
      icon: DollarSign,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    {
      label: "Order Aktif",
      value: `${stats.activeTables}`,
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-700 dark:text-green-300"
    },
    {
      label: "Menu Terlaris",
      value: stats.popularMenu,
      icon: Utensils,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-700 dark:text-orange-300"
    },
    {
      label: "Rata-rata Order",
      value: `Rp ${stats.avgOrderValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      textColor: "text-indigo-700 dark:text-indigo-300"
    },
    {
      label: "Performa Dapur",
      value: stats.kitchenPerformance,
      icon: ChefHat,
      color: "from-gray-500 to-gray-600",
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen">
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
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                timeRange === range
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
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
            className={`${card.bgColor} rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700`}
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
          } shadow-lg border border-gray-200 dark:border-gray-700`}
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
          } shadow-lg border border-gray-200 dark:border-gray-700`}
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
          } shadow-lg border border-gray-200 dark:border-gray-700 lg:col-span-2`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Order Terbaru
          </h3>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order, index) => (
                <div
                  key={order.id || index}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-white" />
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
          } shadow-lg border border-gray-200 dark:border-gray-700`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <span className="text-sm text-blue-700 dark:text-blue-300">Order Rate</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {Math.round((stats.totalOrders / 30) * 100)}/hari
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <span className="text-sm text-green-700 dark:text-green-300">Avg. Order Value</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(stats.avgOrderValue)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <span className="text-sm text-orange-700 dark:text-orange-300">Waktu Penyajian</span>
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {stats.completionTime}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}