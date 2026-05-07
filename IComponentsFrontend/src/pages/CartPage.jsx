import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { downloadOrderPdf } from "../utils/orderPdf";

// Funciones auxiliares para precios y descuentos
import { formatPrice, hasDiscount } from "../utils/price";
// Iconos usados en la página
import {
  CreditCard,
  Lock,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  CheckCircle,
} from "lucide-react";
const API_URL = import.meta.env.VITE_URL_API;

// Estado inicial del formulario de pago simulado
const initialPaymentForm = {
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

const CartPage = () => {
  // Obtenemos el token del usuario autenticado
  const { token } = useAuth();
  // Obtenemos el carrito y la función para recargarlo
  const { cart, loadCart } = useCart();
  // Controla si el modal de pago está abierto
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  // Estado del formulario de pago
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  // Estado para saber si se está procesando el pago
  const [paying, setPaying] = useState(false);

  // Actualiza la cantidad de un producto del carrito
  const updateQuantity = async (lineId, quantity) => {
    // No permitimos cantidades menores que 1
    if (quantity < 1) return;

    await fetch(`${API_URL}/api/order-lines/${lineId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });
    // Recargamos el carrito para ver los cambios
    loadCart();
  };

  // Elimina una línea/producto del carrito
  const removeLine = async (lineId) => {
    await fetch(`${API_URL}/api/order-lines/${lineId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Recargamos el carrito tras eliminar
    loadCart();
  };

  // Maneja cambios en el formulario de pago
  const handlePaymentChange = (e) => {
    setPaymentForm({
      ...paymentForm,
      [e.target.name]: e.target.value,
    });
  };

  // Abre el modal de pago si hay carrito y tiene productos
  const openPaymentModal = () => {
    if (!cart?.id || cart.lines.length === 0) return;
    setPaymentModalOpen(true);
  };

  // Cierra el modal de pago y reinicia el formulario
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentForm(initialPaymentForm);
  };

  // Finaliza la compra realizando un pago simulado
  const checkout = async (e) => {
    e.preventDefault();

    if (!cart?.id) return;

    setPaying(true);

    try {
      const response = await fetch(`${API_URL}/api/orders/${cart.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al finalizar compra");
        return;
      }

      const paidOrder = {
        ...cart,
        id: data.orderId || cart.id,
        status: "paid",
        createdAt: cart.createdAt || new Date().toISOString().slice(0, 19).replace("T", " "),
      };

      downloadOrderPdf(paidOrder);
      // Cerramos modal, notificamos al usuario y recargamos carrito
      closePaymentModal();
      toast.success("Pago realizado correctamente");
      await loadCart();
    } catch (error) {
      console.error("Error procesando pago:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setPaying(false);
    }
  };

  if (!cart) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-gray-500">Cargando carrito...</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Carrito</h1>
        <p className="text-gray-600 mt-1">
          Revisa tus productos antes de finalizar la compra.
        </p>
      </div>

      {cart.lines.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <ShoppingCart size={44} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-600 mt-2">
            Añade productos al carrito para poder realizar un pedido.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {cart.lines.map((line) => (
              <article
                key={line.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-28 h-40 sm:h-28 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {line.product.imageUrl ? (
                      <img
                        src={`${API_URL}${line.product.imageUrl}`}
                        alt={line.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin imagen
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {line.product.name}
                    </h2>

                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Precio unidad:</p>

                      {hasDiscount(line.product.discount) ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">
                            {formatPrice(line.unitPrice)}
                          </span>

                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                            -{line.product.discount}%
                          </span>

                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(line.product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800">
                          {formatPrice(line.unitPrice)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1">
                      Subtotal:{" "}
                      <span className="font-semibold text-gray-900">
                        {formatPrice(line.subtotal)}
                      </span>
                    </p>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden w-fit">
                        <button
                          onClick={() =>
                            updateQuantity(line.id, line.quantity - 1)
                          }
                          className="px-3 py-2 hover:bg-gray-100 disabled:text-gray-300"
                          disabled={line.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>

                        <span className="px-4 py-2 font-medium text-gray-900">
                          {line.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(line.id, line.quantity + 1)
                          }
                          className="px-3 py-2 hover:bg-gray-100"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeLine(line.id)}
                        className="inline-flex items-center justify-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 font-medium"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-fit lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-gray-900">
              Resumen del pedido
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Productos</span>
                <span>
                  {cart.lines.reduce((acc, line) => acc + line.quantity, 0)}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span className="text-green-600 font-medium">Gratis</span>
              </div>

              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {cart.total}€
                </span>
              </div>
            </div>

            <button
              onClick={openPaymentModal}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              <CreditCard size={19} />
              Finalizar compra
            </button>

            <p className="mt-3 text-xs text-gray-500 text-center flex items-center justify-center gap-1">
              <Lock size={13} />
              Pago simulado seguro para demostración
            </p>
          </aside>
        </div>
      )}

      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pago con tarjeta
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Introduce los datos para simular el pago del pedido.
                </p>
              </div>

              <button
                onClick={closePaymentModal}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={22} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CreditCard size={22} />
                </div>

                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Total a pagar
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {cart.total}€
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={checkout} className="space-y-4">
              <input
                name="cardName"
                value={paymentForm.cardName}
                onChange={handlePaymentChange}
                placeholder="Nombre del titular"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                name="cardNumber"
                value={paymentForm.cardNumber}
                onChange={handlePaymentChange}
                placeholder="Número de tarjeta"
                required
                maxLength="19"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  name="expiry"
                  value={paymentForm.expiry}
                  onChange={handlePaymentChange}
                  placeholder="MM/AA"
                  required
                  maxLength="5"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="cvv"
                  value={paymentForm.cvv}
                  onChange={handlePaymentChange}
                  placeholder="CVV"
                  required
                  maxLength="4"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-600">
                <div className="flex gap-2">
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                  <p>
                    Este pago es simulado. No se realiza ningún cargo real, pero
                    se registrará el pedido como pagado y se creará un pago en
                    el backend.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={paying}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Lock size={17} />
                  {paying ? "Procesando..." : "Pagar pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CartPage;