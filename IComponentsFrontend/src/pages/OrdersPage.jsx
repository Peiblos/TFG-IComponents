import { useEffect, useState } from "react";
// Importamos Link para navegar entre páginas
import { Link } from "react-router-dom";
// Iconos usados en la página
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  MapPin,
} from "lucide-react";
// Importamos el contexto de autenticación
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_URL_API;

// Convierte el estado interno del pedido en texto legible
const getStatusLabel = (status) => {
  const labels = {
    cart: "Carrito",
    pending: "Pendiente",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };

  return labels[status] || status || "Sin estado";
};

const OrdersPage = () => {
  // Obtenemos el token del usuario autenticado
  const { token } = useAuth();
  // Lista de pedidos del usuario
  const [orders, setOrders] = useState([]);
  // Estado de carga inicial
  const [loading, setLoading] = useState(true);

  // Carga los pedidos del usuario desde la API
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Eliminamos los carritos para mostrar solo pedidos reales
      setOrders(data.filter((order) => order.status !== "cart"));
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al cargar la página, obtenemos los pedidos
  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft size={17} />
          Seguir comprando
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Mis pedidos</h1>
        <p className="text-gray-600 mt-2">
          Consulta el estado y detalle de tus compras.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <ShoppingBag size={42} className="mx-auto text-gray-400 mb-4" />

          <h2 className="text-xl font-semibold text-gray-900">
            Todavía no tienes pedidos
          </h2>

          <p className="text-gray-600 mt-2">
            Cuando realices una compra, aparecerá aquí.
          </p>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Pedido #{order.id}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={order.status} />

                  <p className="text-xl font-bold text-blue-600">
                    {Number(order.total).toFixed(2)}€
                  </p>
                </div>
              </div>

              {order.shippingAddress && (
                <div className="px-5 sm:px-6 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex gap-2">
                    <MapPin size={18} className="text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Dirección de envío
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state} {order.shippingAddress.postalCode},{" "}
                        {order.shippingAddress.country}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-4">
                {order.lines?.map((line) => (
                  <div
                    key={line.id}
                    className="flex gap-4 border border-gray-200 rounded-2xl p-3"
                  >
                    <Link
                      to={`/products/${line.product?.id}`}
                      className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0"
                    >
                      {line.product?.imageUrl ? (
                        <img
                          src={`${API_URL}${line.product.imageUrl}`}
                          alt={line.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={22} />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/products/${line.product?.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-1"
                      >
                        {line.product?.name}
                      </Link>

                      {line.product?.manufacturerReference && (
                        <p className="text-xs text-gray-500 mt-1">
                          Ref: {line.product.manufacturerReference}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 mt-2">
                        Cantidad: {line.quantity}
                      </p>

                      <p className="text-sm text-gray-500">
                        Precio unidad: {Number(line.unitPrice).toFixed(2)}€
                      </p>

                      <p className="font-semibold text-blue-600 mt-1">
                        Subtotal: {Number(line.subtotal).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

// Etiqueta visual del estado del pedido
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    paid: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
};

// Formatea la fecha en formato español
const formatDate = (date) => {
  if (!date) return "Sin fecha";

  return new Date(date.replace(" ", "T")).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default OrdersPage;