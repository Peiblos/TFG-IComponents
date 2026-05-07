import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, Package, Search, ShoppingBag, X, User, Loader2, ChevronDown } from "lucide-react";
import { downloadOrderPdf } from "../utils/orderPdf";
const API_URL = import.meta.env.VITE_URL_API;

// Convierte el estado interno del pedido en un texto legible
const getStatusLabel = (status) => {
  const labels = {
    cart: "Carrito",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    rejected: "Rechazado",
    pending: "Pendiente",
  };

  return labels[status] || status || "Sin estado";
};

// Estados disponibles para cambiar el estado de un pedido
const statusOptions = [
  { id: "pending", name: "Pendiente" },
  { id: "paid", name: "Pagado" },
  { id: "shipped", name: "Enviado" },
  { id: "delivered", name: "Entregado" },
  { id: "cancelled", name: "Cancelado" },
];

const AdminOrdersPage = () => {
  // Obtenemos el token del usuario administrador
  const { token } = useAuth();
  // Lista de pedidos
  const [orders, setOrders] = useState([]);
  // Texto del buscador
  const [searchTerm, setSearchTerm] = useState("");
  // Pedido seleccionado para ver el detalle
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Estado de carga inicial
  const [loading, setLoading] = useState(true);

  // Actualiza el estado de un pedido desde el panel de administración
  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/admin/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Error al actualizar el estado");
        return;
      }

      // Recargamos la lista para reflejar el cambio
      await loadOrders();
      // Actualizamos también el pedido abierto en el modal
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: data.status } : prev
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
    }
  };

  // Carga todos los pedidos desde la API
  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // No mostramos carritos activos o abandonados en admin
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

  // Filtra pedidos por ID, estado, fecha o email del usuario
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const statusLabel = getStatusLabel(order.status).toLowerCase();

    return (
      String(order.id).includes(term) ||
      order.status?.toLowerCase().includes(term) ||
      statusLabel.includes(term) ||
      order.createdAt?.toLowerCase().includes(term) ||
      order.owner?.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando pedidos...</p>
    </div>
  );
  }

  return (
    <section className="w-full max-w-full space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de pedidos
        </h2>
        <p className="text-gray-600 mt-1">
          Consulta los pedidos realizados en IComponents.
        </p>
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">
            Pedidos registrados
          </h3>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, estado, usuario o fecha..."
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <ShoppingBag size={38} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No se encontraron pedidos.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onView={() => setSelectedOrder(order)}
                />
              ))}
            </div>

            <div className="hidden lg:block border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Pedido
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Productos
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        #{order.id || "Sin ID"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {order.owner?.email || "Sin usuario"}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {order.lines?.length || 0}
                      </td>

                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {order.total}€
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye size={16} />
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
        />
      )}
    </section>
  );
};

// Tarjeta responsive para mostrar pedidos en móvil/tablet
const OrderCard = ({ order, onView }) => {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-gray-900">Pedido #{order.id}</h4>

          <p className="text-sm text-gray-500 mt-1 truncate">
            {order.owner?.email || "Sin usuario"}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            {formatDate(order.createdAt)}
          </p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500">Productos</p>
          <p className="font-semibold text-gray-900 mt-1">
            {order.lines?.length || 0}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-gray-500">Total</p>
          <p className="font-semibold text-blue-600 mt-1">{order.total}€</p>
        </div>
      </div>

      <button
        onClick={onView}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
      >
        <Eye size={16} />
        Ver detalle
      </button>
    </article>
  );
};

// Modal que muestra toda la información de un pedido
const OrderDetailModal = ({ order, onClose, onUpdateStatus  }) => {


  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Pedido #{order.id}
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Usuario</p>
            <p className="text-sm font-semibold text-gray-900 mt-1 truncate">
              {order.owner?.email || "Sin usuario"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Estado</p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Productos</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {order.lines?.length || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {order.total}€
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-2">Cambiar estado</p>

           <StatusDropdown
            value={order.status}
            options={statusOptions}
            onChange={(value) => onUpdateStatus(order.id, value)}
          />
        </div>

        <h4 className="text-lg font-bold text-gray-900 mb-4">
          Productos del pedido
        </h4>

        {order.lines?.length === 0 ? (
          <p className="text-gray-500">Este pedido no tiene productos.</p>
        ) : (
          <div className="space-y-3">
            {order.lines.map((line) => (
              <div
                key={line.id}
                className="border border-gray-200 rounded-2xl p-3 flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
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
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-gray-900 truncate">
                    {line.product?.name}
                  </h5>

                  <p className="text-sm text-gray-500 mt-1">
                    Cantidad: {line.quantity}
                  </p>

                  <p className="text-sm text-gray-500">
                    Precio unidad: {line.unitPrice}€
                  </p>

                  <p className="font-semibold text-blue-600 mt-1">
                    Subtotal: {line.subtotal}€
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
  <button
    onClick={() => downloadOrderPdf(order)}
    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
  >
    Descargar PDF
  </button>

  <button
    onClick={onClose}
    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
  >
    Cerrar
  </button>
</div>
      </div>
    </div>
  );
};

// Dropdown personalizado para cambiar el estado de un pedido
const StatusDropdown = ({ value, options, onChange }) => {
  // Controla si el desplegable está abierto
  const [open, setOpen] = useState(false);
  // Busca la opción actualmente seleccionada
  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );
  // Selecciona un nuevo estado
  const handleSelect = (optionId) => {
    onChange(optionId);
    setOpen(false);
  };

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate text-gray-700">
          {selectedOption ? selectedOption.name : "Selecciona estado"}
        </span>

        <ChevronDown size={18} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-100 flex items-center justify-between gap-2 ${
                  String(value) === String(option.id)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700"
                }`}
              >
                <span>{option.name}</span>

                {String(value) === String(option.id) && (
                  <span className="text-xs">Actual</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Etiqueta visual del estado del pedido
const StatusBadge = ({ status }) => {
  const styles = {
    cart: "bg-gray-100 text-gray-700",
    paid: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    delivered: "bg-purple-100 text-purple-700",
    cancelled: "bg-red-100 text-red-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
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

// Formatea la fecha para mostrarla en formato español
const formatDate = (date) => {
  if (!date) return "Sin fecha";

  return new Date(date.replace(" ", "T")).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default AdminOrdersPage;