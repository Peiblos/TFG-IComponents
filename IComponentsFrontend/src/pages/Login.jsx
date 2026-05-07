import { useState } from "react";
// Importamos herramientas de navegación de React Router
import { Link, useLocation, useNavigate } from "react-router-dom";
// Iconos usados en la pantalla de login
import { Eye, EyeOff, Lock, LogIn, Mail, Monitor, Loader2 } from "lucide-react";
// Importamos el contexto de autenticación
import { useAuth } from "../context/AuthContext";
// Librería para mostrar notificaciones
import toast from "react-hot-toast";
const API_URL = import.meta.env.VITE_URL_API;

const Login = () => {
  // Obtenemos la función login para guardar el token
  const { login } = useAuth();
  // Hook para redirigir al usuario
  const navigate = useNavigate();
  // Hook para saber desde qué ruta venía el usuario
  const location = useLocation();

  // Ruta a la que se volverá tras iniciar sesión
  const from = location.state?.from?.pathname || "/";

  // Estado del formulario de login
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Estado para controlar si se está enviando el formulario
  const [loading, setLoading] = useState(false);
  // Estado para mostrar u ocultar la contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Actualiza los valores del formulario al escribir
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Envía el formulario de login al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Credenciales incorrectas");
      }

      // Guardamos el token en el contexto de autenticación
      login(data.token);
      // Mostramos mensaje de éxito
      toast.success("Sesión iniciada correctamente");
      navigate(from, { replace: true });
    } catch (err) {
      // Mostramos el error recibido
      toast.error(err.message);
    } finally {
      // Finaliza el estado de carga
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sm:p-8">
        <div className="text-center mb-7">
          <Link
            to="/"
            aria-label="Ir al inicio"
            className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:scale-105 hover:shadow-md"
          >
            <Monitor size={30} />
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Iniciar sesión
          </h1>
          <p className="text-gray-600 mt-2">
            Accede a tu cuenta de IComponents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;