import { createContext, useContext, useState, useEffect } from "react";

// Creamos el contexto de autenticación
const AuthContext = createContext();
// Obtenemos la URL de la API desde las variables de entorno de Vite
const API_URL = import.meta.env.VITE_URL_API;

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Si el hook se usa fuera del AuthProvider, lanzamos un error
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Devolvemos los datos y funciones del contexto
  return context;
};

// Componente proveedor que envolverá la aplicación
export const AuthProvider = ({ children }) => {

  // Guardamos el token en el estado, recuperándolo inicialmente de localStorage
  const [token, setToken] = useState(localStorage.getItem("token"));
  // Estado donde se guardarán los datos del usuario autenticado
  const [user, setUser] = useState(null);
  // Estado para saber si se está comprobando la autenticación
  const [authLoading, setAuthLoading] = useState(true);

  // Función para cerrar sesión
  const logout = () => {
    // Eliminamos el token guardado en el navegador
    localStorage.removeItem("token");
    // Limpiamos el token del estado
    setToken(null);
    // Limpiamos los datos del usuario
    setUser(null);
  };

  // Este efecto se ejecuta cada vez que cambia el token
  useEffect(() => {
    // Función asíncrona para cargar los datos del usuario autenticado
    const loadUser = async () => {
      // Si no hay token, no hay usuario autenticado
      if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        // Petición al backend para obtener los datos del usuario actual
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            // Enviamos el token en la cabecera Authorization
            Authorization: `Bearer ${token}`,
          },
        });

        // Si el backend devuelve 401, el token no es válido o ha caducado
        if (res.status === 401) {
          logout();
          setAuthLoading(false);
          return;
        }

        // Si ocurre cualquier otro error en la respuesta, cerramos sesión
        if (!res.ok) {
          logout();
          setAuthLoading(false);
          return;
        }

        // Convertimos la respuesta a JSON
        const data = await res.json();
        // Guardamos los datos del usuario en el estado
        setUser(data);
      } catch (error) {
        // Capturamos errores de red o fallos inesperados
        console.error("Error cargando usuario:", error);
        // Por seguridad, cerramos sesión si falla la carga del usuario
        logout();
      } finally {
        // Indicamos que ha terminado la comprobación de autenticación
        setAuthLoading(false);
      }
    };

    // Ejecutamos la función que carga el usuario
    loadUser();
  }, [token]);

  // Función para iniciar sesión
  const login = (newToken) => {
    // Guardamos el token en localStorage para mantener la sesión
    localStorage.setItem("token", newToken);
    // Actualizamos el token en el estado
    setToken(newToken);
  };

  return (
    // Compartimos el token, usuario y funciones de autenticación con toda la app
    <AuthContext.Provider
      value={{ token, user, login, logout, authLoading }}
    >
      {/* Renderiza todos los componentes hijos envueltos por AuthProvider */}
      {children}
    </AuthContext.Provider>
  );
};