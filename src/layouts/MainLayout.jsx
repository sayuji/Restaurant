import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Restaurant</h2>
        <nav className="flex flex-col gap-3">
          <Link to="/" className="hover:bg-blue-100 px-3 py-2 rounded">Dashboard</Link>
          <Link to="/menu" className="hover:bg-blue-100 px-3 py-2 rounded">Menu</Link>
          <Link to="/tables" className="hover:bg-blue-100 px-3 py-2 rounded">Tables</Link>
          <Link to="/orders" className="hover:bg-blue-100 px-3 py-2 rounded">Orders</Link>
          <Link to="/orderpage" className="hover:bg-blue-100 px-3 py-2 rounded">Pesan Makanan</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">RC Restaurant & Cafe</h1>
          <div className="text-sm text-gray-600">Welcome, Admin</div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
