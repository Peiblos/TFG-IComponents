import { Link } from "react-router-dom";
import { Mail, MapPin, Monitor, ShieldCheck, Truck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-blue-100 border-t border-blue-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                IC
              </div>
              <span className="text-xl font-bold text-gray-900">
                IComponents
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Ecommerce ficticio de componentes informáticos desarrollado como
              proyecto intermodular DAW.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Navegación</h3>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block text-gray-600 hover:text-blue-600">
                Inicio
              </Link>
              <Link
                to="/products"
                className="block text-gray-600 hover:text-blue-600"
              >
                Productos
              </Link>
              <Link
                to="/cart"
                className="block text-gray-600 hover:text-blue-600"
              >
                Carrito
              </Link>
              
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Ventajas</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Truck size={16} className="text-blue-600" />
                Envío simulado gratuito
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600" />
                Pago seguro de demostración
              </p>
              <p className="flex items-center gap-2">
                <Monitor size={16} className="text-blue-600" />
                Componentes informáticos
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                theriseofpauliex@gmail.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Andalucía, España
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} IComponents</p>
          <p>Proyecto DAW - Ecommerce informática</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;