import { createBrowserRouter } from "react-router-dom";

import RootLayout from "../layout/RootLayout";

import HomePage from "../pages/HomePage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProductsPage from "../pages/ProductsPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import OrdersPage from "../pages/OrdersPage";
import CartPage from "../pages/CartPage";
import AdminPage from "../pages/AdminPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminBrandsPage from "../pages/AdminBrandsPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminUsersPage from "../pages/AdminUsersPage";
import ErrorPage from "../pages/ErrorPage";
import ProfilePage from "../pages/ProfilePage";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminRoute from "../components/AdminRoute";

export const router = createBrowserRouter([
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "register",
    element: <Register />,
  },
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "categories/:categoryName",
        element: <ProductsPage />,
      },
      {
        path: "products/:id",
        element: <ProductDetailPage />,
      },
      {
        path: "cart",
        element: (
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
        children: [
          {
            path: "products",
            element: <AdminProductsPage />,
          },
          {
            path: "categories",
            element: <AdminCategoriesPage />,
          },
          {
            path: "brands",
            element: <AdminBrandsPage />,
          },
          {
            path: "orders",
            element: <AdminOrdersPage />,
          },
          {
            path: "users",
            element: <AdminUsersPage />,
          },
        ],
      },
    ],
  },
]);