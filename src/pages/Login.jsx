import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  User, 
  Lock, 
  Coffee, 
  Utensils,
  ChefHat,
  Store,
  Loader
} from "lucide-react";
import { authAPI } from '../services/api';
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token is still valid
      authAPI.getProfile()
        .then(() => navigate("/"))
        .catch(() => {
          // Token invalid, clear and stay on login page
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error("Harap isi username dan password");
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting login for user:', username);
      
      const response = await authAPI.login({ username, password });
      
      if (response.success) {
        // Save token and user data
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        
        toast.success(`Selamat datang, ${response.user.fullName || response.user.username}!`);
        
        console.log('✅ Login successful, redirecting...');
        navigate("/");
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      setShake(true);
      setTimeout(() => setShake(false), 500);

      let errorMessage = "Terjadi kesalahan saat login";
      
      if (error.message.includes('401')) {
        errorMessage = "Username atau password salah!";
      } else if (error.message.includes('500')) {
        errorMessage = "Server error. Silakan coba lagi.";
      } else if (error.message.includes('Network')) {
        errorMessage = "Koneksi gagal. Periksa koneksi internet Anda.";
      } else if (error.message.includes('Session expired')) {
        errorMessage = "Sesi telah berakhir. Silakan login kembali.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Utensils className="w-6 h-6" />,
      title: "Menu Management",
      description: "Kelola menu dengan mudah dan upload gambar"
    },
    {
      icon: <Store className="w-6 h-6" />,
      title: "Table Management", 
      description: "Kelola meja dan generate QR codes otomatis"
    },
    {
      icon: <ChefHat className="w-6 h-6" />,
      title: "Real-time Orders",
      description: "Lacak pesanan secara real-time dari kitchen"
    }
  ];

  const demoUsers = [
    { username: "admin", password: "password", role: "admin", description: "Full Access" },
    { username: "manager", password: "password", role: "manager", description: "Management" },
    { username: "kitchen", password: "password", role: "kitchen", description: "Kitchen Staff" },
    { username: "cashier", password: "password", role: "cashier", description: "Cashier" }
  ];

  const fillDemoCredentials = (user) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full items-center">
        {/* Left Side - Brand & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          {/* Brand */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex items-center justify-center lg:justify-start gap-3 mb-8"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">RestoMaster</h1>
              <p className="text-gray-400 text-lg">Professional Restaurant Management</p>
            </div>
          </motion.div>

          {/* Features */}
          <div className="space-y-6 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  {feature.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-3 gap-4 text-center"
          >
            <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-2xl font-bold text-blue-400">100+</div>
              <div className="text-gray-400 text-sm">Orders/Day</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-2xl font-bold text-blue-400">50+</div>
              <div className="text-gray-400 text-sm">Menu Items</div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-2xl font-bold text-blue-400">24/7</div>
              <div className="text-gray-400 text-sm">Support</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <motion.div
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-gray-700/50 w-full max-w-md"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <LogIn className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-400">
                Sign in to your restaurant dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your username"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Demo Users */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/50"
              >
                <p className="text-sm text-gray-400 text-center mb-3">
                  <strong>Demo Users:</strong>
                </p>
                <div className="space-y-2">
                  {demoUsers.map((user, index) => (
                    <motion.button
                      key={user.username}
                      type="button"
                      onClick={() => fillDemoCredentials(user)}
                      disabled={isLoading}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className="w-full p-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">
                          {user.username}
                        </span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        {user.description}
                      </span>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Password: <span className="text-blue-400">password</span> untuk semua user
                </p>
              </motion.div>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Loader className="w-5 h-5 animate-spin" />
                      Signing in...
                    </motion.div>
                  ) : (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center"
            >
              <p className="text-gray-400 text-sm">
                Secure restaurant management system
              </p>
              <div className="flex justify-center gap-2 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}