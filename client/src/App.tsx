import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { ProductList } from "./pages/ProductList";
import { ProductEdit } from "./pages/ProductEdit";
import { DishList } from "./pages/DishList";
import { DishEdit } from "./pages/DishEdit";

export default function App() {
  return (
    <div className="layout">
      <header className="nav">
        <h1>Книга рецептов</h1>
        <nav className="nav-links">
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Продукты
          </NavLink>
          <NavLink to="/dishes" className={({ isActive }) => (isActive ? "active" : "")}>
            Блюда
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/new" element={<ProductEdit />} />
        <Route path="/products/:id" element={<ProductEdit />} />
        <Route path="/dishes" element={<DishList />} />
        <Route path="/dishes/new" element={<DishEdit />} />
        <Route path="/dishes/:id" element={<DishEdit />} />
      </Routes>
    </div>
  );
}
