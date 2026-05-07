import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Package,
  FolderTree,
  Tags,
  ReceiptText,
  Users,
} from "lucide-react";

const AdminPage = () => {
  // Obtenemos la ruta actual
  const location = useLocation();
  // Enlaces del panel de administración
  const links = [
    { to: "products", label: "Productos", icon: Package },
    { to: "categories", label: "Categorías", icon: FolderTree },
    { to: "brands", label: "Marcas", icon: Tags },
    { to: "orders", label: "Pedidos", icon: ReceiptText },
    { to: "users", label: "Usuarios", icon: Users },
  ];
  // Comprueba si el enlace coincide con la ruta actual
  const isActive = (path) => location.pathname.includes(`/admin/${path}`);
  // Devuelve las clases CSS del enlace según esté activo o no
  const linkClasses = (active) =>
    `flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition ${
      active
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <section className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Header móvil + menú vertical */}
      <div className="md:hidden bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Administración</h1>
        <p className="text-sm text-gray-600 mt-1 mb-4">
          Gestiona la tienda
        </p>

        <nav className="flex flex-col gap-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={linkClasses(isActive(to))}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-fit sticky top-24">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Panel Admin
          </h2>
          <p className="text-sm text-gray-500 mb-6">IComponents</p>

          <nav className="flex flex-col gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={linkClasses(isActive(to))}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <main className="min-w-0">
          <div className="hidden md:block mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Administración
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona productos, categorías, marcas, pedidos y usuarios.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </section>
  );
};

export default AdminPage;