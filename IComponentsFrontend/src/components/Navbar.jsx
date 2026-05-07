// Importamos hooks de React
import { useEffect, useState } from "react";
// Importamos Link para navegar entre páginas y useNavigate para redirigir por código
import { Link, useNavigate } from "react-router-dom";
// Importamos iconos de la librería lucide-react
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  Package,
  Shield,
  Home,
  Monitor,
  ChevronDown,
} from "lucide-react";


// Importamos el contexto de autenticación
import { useAuth } from "../context/AuthContext";
// Importamos el contexto del carrito
import { useCart } from "../context/CartContext";
// URL base de la API desde variables de entorno
const API_URL = import.meta.env.VITE_URL_API;


const Navbar = () => {
  // Obtenemos el usuario actual y la función para cerrar sesión
  const { user, logout } = useAuth();
  // Obtenemos la cantidad de productos del carrito
  const { cartCount } = useCart();
  // Hook para redirigir al usuario desde código
  const navigate = useNavigate();

  // Estado para abrir/cerrar el menú móvil
  const [menuOpen, setMenuOpen] = useState(false);
  // Estado para abrir/cerrar el menú desplegable del usuario
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Estado del texto introducido en el buscador
  const [search, setSearch] = useState("");
  // Estado donde se guardan todos los productos cargados desde la API
  const [products, setProducts] = useState([]);
  // Estado para mostrar u ocultar los resultados del buscador
  const [showResults, setShowResults] = useState(false);

  // Al cargar el componente, obtenemos todos los productos para usarlos en el buscador
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Petición al backend para obtener productos
        const res = await fetch(`${API_URL}/api/products`);
        // Convertimos la respuesta a JSON
        const data = await res.json();
        // Guardamos los productos en el estado
        setProducts(data);
      } catch (error) {
        // Mostramos el error en consola si falla la carga
        console.error("Error cargando productos:", error);
      }
    };
    // Ejecutamos la carga de productos
    loadProducts();
  }, []);

  // Filtra los productos según el texto introducido en el buscador
  const filteredProducts = products.filter((product) => {
    // Convertimos la búsqueda a minúsculas para comparar sin distinguir mayúsculas
    const term = search.toLowerCase();
    // Se busca por nombre del producto o por referencia del fabricante
    return (
      product.name?.toLowerCase().includes(term) ||
      product.manufacturerReference?.toLowerCase().includes(term)
    );
  });

  // Función que se ejecuta al enviar el formulario de búsqueda
  const handleSearchSubmit = (e) => {
    e.preventDefault();

    // Eliminamos espacios al principio y final del texto buscado
    const query = search.trim();
    // Si no hay búsqueda, redirigimos a la página general de productos
    if (!query) {
      navigate("/products");
    } else {
      // Si hay búsqueda, redirigimos a productos con el parámetro search en la URL
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }
    // Limpiamos el buscador y cerramos menús/resultados
    setSearch("");
    setShowResults(false);
    setMenuOpen(false);
  };

  // Función para cerrar sesión desde la navbar
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              IC
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              IComponents
            </span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:block relative flex-1 max-w-sm lg:max-w-md"
          >
            <div className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Buscar componentes..."
                className="w-full border border-gray-300 rounded-l-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 rounded-r-xl hover:bg-blue-700 transition"
              >
                <Search size={18} />
              </button>
            </div>

            {showResults && search.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50">
                {filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 6).map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={() => {
                        setSearch("");
                        setShowResults(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={`${API_URL}${product.imageUrl}`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            IC
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {product.price}€
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    No se encontraron productos
                  </p>
                )}

                {filteredProducts.length > 6 && (
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50"
                  >
                    Ver todos los resultados
                  </button>
                )}
              </div>
            )}
          </form>

          <div className="hidden md:flex items-center gap-3 lg:gap-5 text-sm font-medium text-gray-700">
            <Link
              className="hover:text-blue-600 transition flex items-center gap-1"
              to="/"
            >
              <Home size={17} />
              Inicio
            </Link>

            <Link
              className="hover:text-blue-600 transition flex items-center gap-1"
              to="/products"
            >
              <Monitor size={17} />
              Productos
            </Link>

            {user && (
              <>
                <Link
                  className="relative hover:text-blue-600 transition flex items-center gap-1"
                  to="/cart"
                >
                  <ShoppingCart size={18} />
                  Carrito

                  {cartCount > 0 && (
                    <span className="absolute -top-3 -right-4 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {user?.roles?.includes("ROLE_ADMIN") && (
                  <Link
                    className="hover:text-blue-600 transition flex items-center gap-1"
                    to="/admin"
                  >
                    <Shield size={17} />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>

                  <span className="hidden lg:block max-w-[140px] truncate">
                    {user.firstName}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b">
                      <p className="text-xs text-gray-500">Conectado como</p>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User size={16} />
                      Mi perfil
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Package size={16} />
                      Mis pedidos
                    </Link>

                    {user?.roles?.includes("ROLE_ADMIN") && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Shield size={16} />
                        Panel de administración
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm hover:text-blue-600">
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t py-4 flex flex-col gap-4 text-gray-700">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowResults(true);
                  }}
                  placeholder="Buscar productos..."
                  className="w-full border border-gray-300 rounded-l-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 rounded-r-xl"
                >
                  <Search size={18} />
                </button>
              </div>

              {search.trim() && showResults && (
                <div className="mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 5).map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        onClick={() => {
                          setSearch("");
                          setShowResults(false);
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={`${API_URL}${product.imageUrl}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              IC
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-blue-600 font-semibold">
                            {product.price}€
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No se encontraron productos
                    </p>
                  )}
                </div>
              )}
            </form>

            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <Home size={18} />
              Inicio
            </Link>

            <Link
              to="/products"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <Monitor size={18} />
              Productos
            </Link>

            {user ? (
              <>
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Carrito {cartCount > 0 && `(${cartCount})`}
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <User size={18} />
                  Mi perfil
                </Link>

                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2"
                >
                  <Package size={18} />
                  Mis pedidos
                </Link>

                {user?.roles?.includes("ROLE_ADMIN") && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Shield size={18} />
                    Panel de administración
                  </Link>
                )}

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Conectado como</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  <LogOut size={17} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-center"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;