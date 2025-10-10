import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) navigate("/");
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "12345") {
      localStorage.setItem("user", JSON.stringify({ username }));
      Swal.fire({
        icon: "success",
        title: "Login Berhasil!",
        text: `Selamat datang, ${username}!`,
        timer: 2000,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/"), 2000);
    } else {
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Username atau password salah!",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-96 text-white">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-400">
          🍽️ Login Admin
        </h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 transition py-2 rounded-lg font-semibold"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
