import { useEffect, useState } from "react";
// Importamos Link para navegar y useParams para obtener el id de la URL
import { Link, useParams } from "react-router-dom";
// Iconos usados en la página
import {
  ArrowLeft,
  ShoppingCart,
  PackageX,
  Star,
  Trash2,
  MessageSquare,
  Loader2,
} from "lucide-react";
// Importamos el contexto de autenticación
import { useAuth } from "../context/AuthContext";
// Importamos el contexto del carrito
import { useCart } from "../context/CartContext";
// Modal reutilizable para confirmar eliminaciones
import ConfirmModal from "../components/ConfirmModal";
// Librería para mostrar notificaciones
import toast from "react-hot-toast";
// Funciones auxiliares para calcular y mostrar precios
import { getDiscountedPrice, formatPrice, hasDiscount } from "../utils/price";
const API_URL = import.meta.env.VITE_URL_API;
// Número de reseñas que se muestran por página
const REVIEWS_PER_PAGE = 5;
// Estado inicial del formulario de reseñas
const initialReviewForm = {
  rating: 5,
  title: "",
  comment: "",
};

const ProductDetailPage = () => {
  // Obtenemos el id del producto desde la URL
  const { id } = useParams();
  // Obtenemos el token y el usuario autenticado
  const { token, user } = useAuth();
  // Obtenemos la función para recargar el carrito
  const { loadCart } = useCart();
  // Datos del producto
  const [product, setProduct] = useState(null);
  // Lista de reseñas del producto
  const [reviews, setReviews] = useState([]);
  // Formulario para crear reseña
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  // Estados de carga y acciones
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState(false);
  const [creatingReview, setCreatingReview] = useState(false);
  // Reseña seleccionada para eliminar
  const [reviewToDelete, setReviewToDelete] = useState(null);
  // Estado de eliminación de reseña
  const [deletingReview, setDeletingReview] = useState(false);
  // Página actual de reseñas
  const [reviewsPage, setReviewsPage] = useState(1);

  // Carga los datos del producto desde la API
  const loadProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products/${id}`);
      // Si la API devuelve 404, marcamos el producto como no encontrado
      if (response.status === 404) {
        setNotFound(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Error cargando producto");
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("Error cargando producto:", error);
      toast.error("Error al cargar el producto");
    } finally {
      setLoading(false);
    }
  };

  // Carga las reseñas asociadas al producto
  const loadReviews = async () => {
    try {
      const response = await fetch(`${API_URL}/api/product-reviews/product/${id}`);
      const data = await response.json();

      setReviews(data);
      // Reiniciamos la paginación al cargar reseñas
      setReviewsPage(1);
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    }
  };

  // Cada vez que cambia el id, recargamos producto y reseñas
  useEffect(() => {
    loadProduct();
    loadReviews();
  }, [id]);

  // Añade el producto actual al carrito
  const addToCart = async () => {
    // Si no hay sesión iniciada, no permitimos añadir
    if (!token) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(`${API_URL}/api/order-lines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al añadir al carrito");
        return;
      }

      // Recargamos el carrito para actualizar el contador
      await loadCart();
      toast.success("Producto añadido al carrito 🛒");
    } catch (error) {
      console.error("Error añadiendo al carrito:", error);
      toast.error("Error al añadir al carrito");
    } finally {
      setAdding(false);
    }
  };

  // Maneja cambios en el formulario de reseña
  const handleReviewChange = (e) => {
    setReviewForm({
      ...reviewForm,
      [e.target.name]: e.target.value,
    });
  };

  // Crea una nueva reseña del producto
  const createReview = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Debes iniciar sesión para opinar");
      return;
    }

    setCreatingReview(true);

    try {
      const response = await fetch(`${API_URL}/api/product-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: Number(id),
          rating: Number(reviewForm.rating),
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al crear la reseña");
        return;
      }

      // Reiniciamos formulario y recargamos reseñas
      setReviewForm(initialReviewForm);
      await loadReviews();
      toast.success("Reseña publicada correctamente");
    } catch (error) {
      console.error("Error creando reseña:", error);
      toast.error("Error al crear la reseña");
    } finally {
      setCreatingReview(false);
    }
  };

  // Elimina una reseña seleccionada
  const deleteReview = async () => {
    if (!reviewToDelete) return;

    setDeletingReview(true);

    try {
      const response = await fetch(
        `${API_URL}/api/product-reviews/${reviewToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        toast.error("Error al eliminar la reseña");
        return;
      }

      await loadReviews();
      toast.success("Reseña eliminada correctamente");
      setReviewToDelete(null);
    } catch (error) {
      console.error("Error eliminando reseña:", error);
      toast.error("Error al eliminar la reseña");
    } finally {
      setDeletingReview(false);
    }
  };

  // Comprueba si el usuario puede eliminar una reseña
  const canDeleteReview = (review) => {
    return (
      user &&
      (review.userId === user.id || user.roles?.includes("ROLE_ADMIN"))
    );
  };

  // Calcula la valoración media del producto
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) /
        reviews.length
      : 0;

    // Calcula el total de páginas de reseñas
  const totalReviewPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);

  // Obtiene solo las reseñas de la página actual
  const paginatedReviews = reviews.slice(
    (reviewsPage - 1) * REVIEWS_PER_PAGE,
    reviewsPage * REVIEWS_PER_PAGE
  );

  // Comprueba si el usuario actual es administrador
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando producto...</p>
    </div>
  );
  }

  if (notFound) {
    return (
      <section className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
          <PackageX size={34} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          Producto no encontrado
        </h1>

        <p className="text-gray-600 mt-2">
          El producto que buscas no existe o ya no está disponible.
        </p>

        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft size={18} />
          Volver al catálogo
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Volver al catálogo
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden grid gap-6 lg:grid-cols-2">
        <div className="relative bg-gray-100 min-h-[320px] lg:min-h-[520px]">
          {hasDiscount(product.discount) && (
            <span className="absolute top-4 left-4 z-10 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-sm">
              -{product.discount}%
            </span>
          )}

          {product.imageUrl ? (
            <img
              src={`${API_URL}${product.imageUrl}`}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Sin imagen
            </div>
          )}
        </div>

        <div className="p-5 sm:p-8 flex flex-col justify-center">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            {product.category || "Producto"}
          </p>

          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {product.name}
          </h1>

          {product.brand && (
            <p className="text-gray-500 mt-2">Marca: {product.brand}</p>
          )}

          {product.manufacturerReference && (
            <p className="text-sm text-gray-500">
              Ref. fabricante:{" "}
              <span className="font-medium text-gray-700">
                {product.manufacturerReference}
              </span>
            </p>
          )}

          {isAdmin && product.sku && (
            <p className="text-xs text-gray-400 mt-1">
              SKU: {product.sku}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Stars rating={Math.round(averageRating)} />
            <span className="text-sm text-gray-500">
              {reviews.length > 0
                ? `${averageRating.toFixed(1)} / 5 (${reviews.length} reseñas)`
                : "Sin reseñas todavía"}
            </span>
          </div>

          <p className="text-gray-600 mt-5 leading-relaxed whitespace-pre-line">
            {product.description || "Este producto no tiene descripción."}
          </p>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              {hasDiscount(product.discount) ? (
                <>
                  <p className="text-3xl font-bold text-red-600">
                    {formatPrice(
                      getDiscountedPrice(product.price, product.discount)
                    )}
                  </p>

                  <p className="text-sm text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </p>
                </>
              ) : (
                <p className="text-3xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <span
              className={`text-sm font-semibold ${
                product.stock > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {product.stock > 0 ? `Stock: ${product.stock}` : "Sin stock"}
            </span>
          </div>

          <button
            onClick={addToCart}
            disabled={product.stock <= 0 || adding}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={19} />
            {adding
              ? "Añadiendo..."
              : product.stock > 0
              ? "Añadir al carrito"
              : "Sin stock"}
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare size={22} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Reseñas del producto
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-600">
                Todavía no hay reseñas para este producto.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedReviews.map((review) => (
                  <article
                    key={review.id}
                    className="border border-gray-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Stars rating={review.rating} />

                        <h3 className="font-semibold text-gray-900 mt-2">
                          {review.title || "Sin título"}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Por {review.userName || `Usuario #${review.userId}`}
                        </p>
                      </div>

                      {canDeleteReview(review) && (
                        <button
                          type="button"
                          onClick={() => setReviewToDelete(review)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-xl hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <p className="text-gray-600 mt-3 whitespace-pre-line">{review.comment}</p>

                    {review.createdAt && (
                      <p className="text-xs text-gray-400 mt-3">
                        {new Date(review.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              {totalReviewPages > 1 && (
                <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setReviewsPage((page) => Math.max(page - 1, 1))
                    }
                    disabled={reviewsPage === 1}
                    className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  {[...Array(totalReviewPages)].map((_, index) => {
                    const page = index + 1;

                    return (
                      <button
                        key={page}
                        onClick={() => setReviewsPage(page)}
                        className={`px-4 py-2 rounded-lg border font-medium ${
                          reviewsPage === page
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
                      setReviewsPage((page) => Math.min(page + 1, totalReviewPages))
                    }
                    disabled={reviewsPage === totalReviewPages}
                    className="px-4 py-2 rounded-lg border bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-gray-900">
            Escribe una reseña
          </h2>

          {!token ? (
            <p className="text-gray-600 mt-3">
              Debes{" "}
              <Link to="/login" className="text-blue-600 font-medium">
                iniciar sesión
              </Link>{" "}
              para valorar este producto.
            </p>
          ) : (
            <form onSubmit={createReview} className="space-y-4 mt-5">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Valoración
                </label>
                <select
                  name="rating"
                  value={reviewForm.rating}
                  onChange={handleReviewChange}
                  className="mt-1 w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5 estrellas</option>
                  <option value="4">4 estrellas</option>
                  <option value="3">3 estrellas</option>
                  <option value="2">2 estrellas</option>
                  <option value="1">1 estrella</option>
                </select>
              </div>

              <input
                name="title"
                value={reviewForm.title}
                onChange={handleReviewChange}
                placeholder="Título de la reseña"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                name="comment"
                value={reviewForm.comment}
                onChange={handleReviewChange}
                placeholder="Cuéntanos tu opinión..."
                required
                rows="4"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={creatingReview}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {creatingReview ? "Publicando..." : "Publicar reseña"}
              </button>
            </form>
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(reviewToDelete)}
        title="Eliminar reseña"
        message="¿Seguro que quieres eliminar esta reseña? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deletingReview}
        onConfirm={deleteReview}
        onCancel={() => {
          if (!deletingReview) setReviewToDelete(null);
        }}
      />
    </section>
  );
};

// Componente que muestra estrellas según la valoración recibida
const Stars = ({ rating = 0 }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={18}
          className={
            star <= Number(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }
        />
      ))}
    </div>
  );
};

export default ProductDetailPage;