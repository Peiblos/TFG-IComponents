import { RouterProvider } from "react-router-dom";
import { router } from "./router/router";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "12px",
              background: "#111827",
              color: "#fff",
              fontSize: "14px",
            },
            success: {
              iconTheme: {
                primary: "#16a34a",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#dc2626",
                secondary: "#fff",
              },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;


