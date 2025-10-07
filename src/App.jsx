import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Tables from "./pages/Tables";
import Orders from "./pages/Orders";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/tables" element={<Tables />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  );
}

export default App;
