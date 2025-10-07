import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Tables from "./pages/Tables";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import Checkout from "./pages/Checkout"; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orderpage" element={<OrderPage />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  );
}

export default App;
