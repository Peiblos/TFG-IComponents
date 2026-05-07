import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, ShoppingBag } from "lucide-react";

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white border border-gray-200 rounded-3xl shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-5">
          <AlertTriangle size={34} />
        </div>

        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
          Error {error?.status || "inesperado"}
        </p>

        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Ups, algo ha salido mal
        </h1>

        <p className="text-gray-600 mt-3">
          La página que buscas no existe o se ha producido un problema al cargar
          el contenido.
        </p>

        {error?.statusText && (
          <p className="mt-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-3">
            {error.statusText}
          </p>
        )}

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            <Home size={18} />
            Volver al inicio
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            <ShoppingBag size={18} />
            Ver productos
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ErrorPage;