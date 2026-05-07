import { useEffect, useState } from "react";
// Importamos herramientas de React Router
import { Link, useParams, useSearchParams } from "react-router-dom";
// Contexto de autenticación para obtener el token
import { useAuth } from "../context/AuthContext";
// Contexto del carrito para recargarlo tras añadir productos
import { useCart } from "../context/CartContext";
// Librería para mostrar notificaciones
import toast from "react-hot-toast";
// Iconos usados en la página
import { Filter, X, Loader2 } from "lucide-react";
// Funciones auxiliares para precios y descuentos
import { getDiscountedPrice, formatPrice, hasDiscount } from "../utils/price";
const API_URL = import.meta.env.VITE_URL_API;

// Número de productos por página
const PRODUCTS_PER_PAGE = 6;

const ProductsPage = () => {
  // Obtenemos token del usuario autenticado
  const { token } = useAuth();
  // Obtenemos función para actualizar el carrito
  const { loadCart } = useCart();
  // Obtiene la categoría de la URL si existe
  const { categoryName } = useParams();
  // Obtiene parámetros de búsqueda de la URL
  const [searchParams] = useSearchParams();

  // Texto de búsqueda recibido por query string
  const search = searchParams.get("search") || "";

    // Estados principales
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Estado de filtros
  const [filters, setFilters] = useState({
    category: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
    onlyStock: false,
  });

  // Carga productos, categorías y marcas desde la API
  const loadProducts = async () => {
    try {
      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        fetch(`${API_URL}/api/products`),
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/brands`),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      const brandsData = await brandsRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al cargar la página, obtenemos los datos necesarios
  useEffect(() => {
    loadProducts();
  }, []);

  // Reinicia la paginación cuando cambia la categoría, búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryName, search, filters]);

  // Maneja cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Limpia todos los filtros
  const clearFilters = () => {
    setFilters({
      category: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      onlyStock: false,
    });
  };

  // Añade un producto al carrito
  const addToCart = async (productId) => {
    if (!token) {
      toast.error("Debes iniciar sesión");
      return;
    }

    const res = await fetch(`${API_URL}/api/order-lines`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Error al añadir al carrito");
      return;
    }

    await loadCart();
    toast.success("Producto añadido al carrito 🛒");
  };

  // Aplica búsqueda, categoría de ruta y filtros
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const routeCategory = categoryName
      ? product.category?.toLowerCase() === categoryName.toLowerCase()
      : true;

    const matchesCategory = filters.category
      ? product.category === filters.category
      : true;

    const matchesBrand = filters.brand ? product.brand === filters.brand : true;

    const matchesMinPrice = filters.minPrice
      ? product.price >= Number(filters.minPrice)
      : true;

    const matchesMaxPrice = filters.maxPrice
      ? product.price <= Number(filters.maxPrice)
      : true;

    const matchesStock = filters.onlyStock ? product.stock > 0 : true;

    return (
      matchesSearch &&
      routeCategory &&
      matchesCategory &&
      matchesBrand &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesStock
    );
  });

  // Calcula la paginación
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;

  // Productos que se muestran en la página actual
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + PRODUCTS_PER_PAGE
  );

  if (loading) {
  return (
    <div className="flex flex-col justify-center items-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando productos...</p>
    </div>
  );
}

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            Catálogo
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-1">
            {categoryName
              ? categoryName
              : search
              ? `Resultados para "${search}"`
              : "Productos"}
          </h1>

          <p className="text-gray-600 mt-2">
            Componentes, periféricos y accesorios para montar tu setup ideal.
          </p>
        </div>

        {(categoryName || search) && (
          <Link
            to="/products"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Ver todos los productos
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-fit lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-blue-600" />
              <h2 className="font-bold text-gray-900">Filtros</h2>
            </div>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Marca
              </label>
              <select
                name="brand"
                value={filters.brand}
                onChange={handleFilterChange}
                className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                  {brand.name}
                </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Precio mín.
                </label>
                <input
                  name="minPrice"
                  type="number"
                  min="0"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  placeholder="0"
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Precio máx.
                </label>
                <input
                  name="maxPrice"
                  type="number"
                  min="0"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  placeholder="999"
                  className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <input
                type="checkbox"
                name="onlyStock"
                checked={filters.onlyStock}
                onChange={handleFilterChange}
                className="w-4 h-4"
              />
              Mostrar solo productos con stock
            </label>
          </div>
        </aside>

        <div>
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
              <X size={38} className="mx-auto text-gray-400 mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                No hay productos disponibles
              </h2>
              <p className="text-gray-600 mt-2">
                No se encontraron productos con esos filtros.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex justify-between items-center text-sm text-gray-500">
                <p>
                  Mostrando {paginatedProducts.length} de{" "}
                  {filteredProducts.length} productos
                </p>

                {totalPages > 1 && (
                  <p>
                    Página {currentPage} de {totalPages}
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <article
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    <Link
                      to={`/products/${product.id}`}
                      className="relative block bg-gray-100 aspect-[4/3] sm:aspect-[1/1] lg:aspect-[4/3] overflow-hidden"
                    >
                      {hasDiscount(product.discount) && (
                        <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                          -{product.discount}%
                        </span>
                      )}

                      {product.imageUrl ? (
                        <img
                          src={`${API_URL}${product.imageUrl}`}
                          alt={product.name}
                          className="w-full h-full object-contain p-3"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <Link to={`/products/${product.id}`}>
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition">
                          {product.name}
                        </h2>
                      </Link>

                      {product.category && (
                        <p className="text-sm text-gray-500 mt-1">
                          {product.category}
                        </p>
                      )}

                      {product.brand && (
                        <p className="text-sm text-gray-500">
                          Marca: {product.brand}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          {hasDiscount(product.discount) ? (
                            <>
                              <div className="flex items-center gap-2">
                                <p className="text-2xl font-bold text-red-600">
                                  {formatPrice(getDiscountedPrice(product.price, product.discount))}
                                </p>
                              </div>

                              <p className="text-sm text-gray-400 line-through">
                                {formatPrice(product.price)}
                              </p>
                            </>
                          ) : (
                            <p className="text-2xl font-bold text-blue-600">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>

                        <span
                          className={`text-sm font-medium ${
                            product.stock > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.stock > 0
                            ? `Stock: ${product.stock}`
                            : "Sin stock"}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock <= 0}
                        className="mt-5 w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {product.stock > 0 ? "Añadir al carrito" : "Sin stock"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg border font-medium ${
                          currentPage === page
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.min(page + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsPage;