import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// Importamos componentes de React Leaflet para mostrar el mapa
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// Importamos Leaflet para configurar los iconos del mapa
import L from "leaflet";
// Iconos usados para representar categorías
import {
  Cpu,
  Monitor,
  Keyboard,
  Mouse,
  HardDrive,
  MemoryStick,
  Headphones,
  Gamepad2,
  Package,
  Laptop,
  Smartphone,
  Printer,
  Speaker,
  Webcam,
  Router,
  Cable,
  Fan,
  BatteryCharging,
  Server,
  Microchip,
  Tablet,
  Tv,
  Joystick,
  Disc3,
} from "lucide-react";
const API_URL = import.meta.env.VITE_URL_API;

// Eliminamos la configuración por defecto del icono de Leaflet
delete L.Icon.Default.prototype._getIconUrl;

// Configuramos manualmente los iconos del marcador del mapa
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Coordenadas donde aparece ubicada la tienda ficticia
const storePosition = [37.1838, -3.6176];

// Relación entre slugs de categorías e iconos
const categoryIcons = {
  procesadores: Cpu,
  cpu: Cpu,
  microprocesadores: Cpu,

  monitores: Monitor,
  pantallas: Monitor,
  tv: Tv,

  teclados: Keyboard,
  teclado: Keyboard,

  ratones: Mouse,
  mouse: Mouse,

  almacenamiento: HardDrive,
  discos: HardDrive,
  "discos duros": HardDrive,
  ssd: Disc3,
  hdd: HardDrive,

  ram: MemoryStick,
  memoria: MemoryStick,
  memorias: MemoryStick,

  auriculares: Headphones,
  cascos: Headphones,
  audio: Speaker,
  altavoces: Speaker,

  gaming: Gamepad2,
  mandos: Joystick,
  videojuegos: Gamepad2,

  portatiles: Laptop,
  portátil: Laptop,
  portátiles: Laptop,
  laptops: Laptop,

  moviles: Smartphone,
  móviles: Smartphone,
  smartphones: Smartphone,

  impresoras: Printer,
  webcam: Webcam,
  webcams: Webcam,

  routers: Router,
  redes: Router,

  cables: Cable,
  ventiladores: Fan,
  refrigeracion: Fan,
  refrigeración: Fan,

  baterias: BatteryCharging,
  baterías: BatteryCharging,

  servidores: Server,
  placas: Microchip,
  "placas base": Microchip,

  tablets: Tablet,
};

// Normaliza texto: pasa a minúsculas y elimina tildes
const normalizeText = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// Devuelve el icono correspondiente según el slug de la categoría
const getCategoryIcon = (slug) => {
  // Si no hay slug, usamos un icono genérico
  if (!slug) return Package;

  const slugs = slug
    .split(",")
    .map((item) => normalizeText(item.trim()));

  // Busca el primer slug que tenga icono asignado
  const matchedSlug = slugs.find((item) => categoryIcons[item]);
  // Si encuentra coincidencia devuelve ese icono, si no uno genérico
  return matchedSlug ? categoryIcons[matchedSlug] : Package;
};

const heroSlides = [
  {
    image: "./images/setup-1.jpg",
    title: "Componentes informáticos para montar el setup perfecto",
    text: "Encuentra procesadores, tarjetas gráficas, periféricos y accesorios para llevar tu equipo al siguiente nivel.",
  },
  {
    image: "./images/setup-2.jpg",
    title: "Potencia tu equipo con los mejores componentes",
    text: "Todo lo que necesitas para mejorar rendimiento, diseño y experiencia gaming.",
  },
  {
    image: "./images/setup-3.jpg",
    title: "Periféricos y hardware para cada necesidad",
    text: "Explora productos pensados para estudiantes, gamers y profesionales.",
  },
];

const HomePage = () => {
  // Lista de categorías mostradas en la página principal
  const [categories, setCategories] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carga las categorías desde la API
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  // Al cargar la página, obtenemos las categorías
  useEffect(() => {
    loadCategories();
     const interval = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, 4000);

  return () => clearInterval(interval);
  }, []);

  return (
    <section className="space-y-16">
      <div className="relative rounded-3xl text-white overflow-hidden min-h-[420px]">
  {heroSlides.map((slide, index) => (
    <img
      key={index}
      src={slide.image}
      alt={slide.title}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
        index === currentSlide ? "opacity-100" : "opacity-0"
      }`}
    />
  ))}

  <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-black/30" />

  <div className="relative z-10 px-6 py-14 sm:px-10 lg:px-16 lg:py-20 max-w-4xl">
    <p className="text-blue-100 font-medium mb-3">
      Bienvenido a IComponents
    </p>

    <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
      {heroSlides[currentSlide].title}
    </h1>

    <p className="mt-5 text-blue-100 text-lg max-w-2xl">
      {heroSlides[currentSlide].text}
    </p>

    <div className="mt-8 flex flex-col sm:flex-row gap-4">
      <Link
        to="/products"
        className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold text-center hover:bg-blue-50 transition"
      >
        Ver productos
      </Link>

      <Link
        to="/register"
        className="border border-white/40 px-6 py-3 rounded-xl font-semibold text-center hover:bg-white/10 transition"
      >
        Crear cuenta
      </Link>
    </div>
  </div>

  <div className="absolute bottom-5 left-6 sm:left-10 lg:left-16 z-20 flex gap-2">
    {heroSlides.map((_, index) => (
      <button
        key={index}
        onClick={() => setCurrentSlide(index)}
        className={`w-3 h-3 rounded-full transition ${
          index === currentSlide ? "bg-white" : "bg-white/40"
        }`}
        aria-label={`Ir a la imagen ${index + 1}`}
      />
    ))}
  </div>
</div>

      <div>
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            Categorías
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            Explora por tipo de producto
          </h2>
        </div>

        {categories.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-600">
              Todavía no hay categorías disponibles.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);

              return (
                <Link
                  key={category.id}
                  to={`/categories/${category.name}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Icon size={26} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    {category.name}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Ver productos de la categoría {category.name}.
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            Nuestra tienda
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-2">
            Encuéntranos en nuestro centro
          </h2>

          <p className="text-gray-600 mt-2">
            Tienda ficticia ubicada en el instituto IES Politécnico Hermenegildo Lanz para el proyecto DAW.
          </p>
        </div>

        <div className="h-[400px] w-full rounded-2xl overflow-hidden">
          <MapContainer
            center={storePosition}
            zoom={16}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={storePosition}>
              <Popup>
                <strong>IComponents</strong>
                <br />
                Tienda ficticia del proyecto DAW
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
};

export default HomePage;