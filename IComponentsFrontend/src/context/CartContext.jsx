// Importamos hooks de React
import { createContext, useContext, useEffect, useState } from "react";
// Importamos el contexto de autenticación para saber si el usuario está logueado
import { useAuth } from "./AuthContext";
// URL de la API desde variables de entorno
const API_URL = import.meta.env.VITE_URL_API;

// Creamos el contexto del carrito
const CartContext = createContext();

// Componente proveedor del carrito
export const CartProvider = ({ children }) => {
  // Obtenemos datos de autenticación (token, usuario y estado de carga)
  const { token, user, authLoading } = useAuth();

  // Estado del carrito (objeto completo con líneas, etc.)
  const [cart, setCart] = useState(null);
  // Estado con el número total de productos en el carrito
  const [cartCount, setCartCount] = useState(0);

  // Función para vaciar el carrito (estado local)
  const clearCart = () => {
    setCart(null);
    setCartCount(0);
  };

  // Función para cargar el carrito desde el backend
  const loadCart = async () => {
    // Si aún se está comprobando la autenticación, no hacemos nada
    if (authLoading) return;
    // Si no hay token o usuario, limpiamos el carrito
    if (!token || !user) {
      clearCart();
      return;
    }

    try {
      // Petición al backend para obtener el carrito actual del usuario
      const response = await fetch(`${API_URL}/api/orders/current`, {
        headers: {
          // Enviamos el token para autenticar la petición
          Authorization: `Bearer ${token}`,
        },
      });

      // Si el token no es válido, limpiamos el carrito
      if (response.status === 401) {
        clearCart();
        return;
      }

      // Si hay cualquier otro error en la respuesta
      if (!response.ok) {
        clearCart();
        return;
      }

      // Convertimos la respuesta a JSON
      const data = await response.json();
      // Guardamos el carrito completo
      setCart(data);

      // Calcula el total de productos sumando las cantidades de cada línea
      const totalItems =
        data.lines?.reduce((acc, line) => acc + line.quantity, 0) || 0;

      // Guardamos el número total de productos
      setCartCount(totalItems);
    } catch (error) {
      // Si hay error de red o fallo inesperado
      console.error("Error loading cart:", error);
      // Limpiamos el carrito por seguridad
      clearCart();
    }
  };

  // Este efecto se ejecuta cuando cambia el token, usuario o estado de carga
  useEffect(() => {
    loadCart();
  }, [token, user, authLoading]);

  return (
    // Proporcionamos los datos del carrito a toda la aplicación
    <CartContext.Provider value={{ cart, cartCount, loadCart, setCart }}>
      {/* Renderiza los componentes hijos */}
      {children}
    </CartContext.Provider>
  );
};

// Hook personalizado para usar el carrito fácilmente en cualquier componente
export const useCart = () => useContext(CartContext);