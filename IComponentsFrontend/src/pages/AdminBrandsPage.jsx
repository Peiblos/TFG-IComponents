// Importamos hooks de React
import { useEffect, useState } from "react";
// Importamos el contexto de autenticación para obtener el token
import { useAuth } from "../context/AuthContext";
// Modal reutilizable para confirmar eliminaciones
import ConfirmModal from "../components/ConfirmModal";
// Librería para mostrar mensajes emergentes
import toast from "react-hot-toast";
// Iconos usados en la interfaz
import { BadgePlus, Pencil, Trash2, X, Save, Tags, Loader2 } from "lucide-react";

// URL base de la API
const API_URL = import.meta.env.VITE_URL_API;

// Estado inicial del formulario de marca
const initialForm = {
  name: "",
  description: "",
  originCountry: "",
  logo: null,
};

const AdminBrandsPage = () => {
  // Obtenemos el token del usuario autenticado
  const { token } = useAuth();
  // Lista de marcas
  const [brands, setBrands] = useState([]);
  // Formulario para crear una marca
  const [form, setForm] = useState(initialForm);
  // Formulario para editar una marca
  const [editForm, setEditForm] = useState(initialForm);
  // Marca que se está editando actualmente
  const [editingBrand, setEditingBrand] = useState(null);
  // Texto del buscador
  const [searchTerm, setSearchTerm] = useState("");
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  // Marca seleccionada para eliminar
  const [brandToDelete, setBrandToDelete] = useState(null);
  // Estado para saber si se está eliminando
  const [deleting, setDeleting] = useState(false);

  // Carga todas las marcas desde la API
  const loadBrands = async () => {
    try {
      const response = await fetch(`${API_URL}/api/brands`);
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error cargando marcas:", error);
    } finally {
      setLoading(false);
    }
  };
  // Al cargar la página, obtenemos las marcas
  useEffect(() => {
    loadBrands();
  }, []);

  // Maneja los cambios del formulario de creación
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm({
      ...form,
      // Si es un archivo, guardamos el archivo; si no, el texto
      [name]: type === "file" ? files[0] : value,
    });
  };

  // Maneja los cambios del formulario de edición
  const handleEditChange = (e) => {
    const { name, value, files, type } = e.target;

    setEditForm({
      ...editForm,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // Construye un FormData para enviar texto e imagen al backend
  const buildFormData = (data) => {
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("originCountry", data.originCountry);

    // Solo añadimos logo si el usuario ha seleccionado uno
    if (data.logo) {
      formData.append("logo", data.logo);
    }

    return formData;
  };

  // Valida que el logo sea PNG
  const validateLogo = (logo) => {
    if (logo && logo.type !== "image/png") {
      toast.error("El logo debe ser una imagen PNG");
      return false;
    }

    return true;
  };

  // Crea una nueva marca
  const handleCreate = async (e) => {
    e.preventDefault();

    // Validamos el logo antes de enviar
    if (!validateLogo(form.logo)) return;

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/brands`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(form),
      });

      // Si el backend devuelve error, mostramos el mensaje
      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Error al crear la marca");
        return;
      }

      // Reiniciamos formulario, recargamos marcas y mostramos mensaje
      setForm(initialForm);
      e.target.reset();
      await loadBrands();
      toast.success("Marca creada correctamente");
    } catch (error) {
      console.error("Error creando marca:", error);
      toast.error("Error al crear la marca");
    } finally {
      setCreating(false);
    }
  };

  // Abre el modal de edición con los datos de la marca seleccionada
  const openEditModal = (brand) => {
    setEditingBrand(brand);
    setEditForm({
      name: brand.name || "",
      description: brand.description || "",
      originCountry: brand.originCountry || "",
      logo: null,
    });
  };

  // Cierra el modal de edición
  const closeEditModal = () => {
    setEditingBrand(null);
    setEditForm(initialForm);
  };

  // Actualiza una marca existente
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingBrand) return;
    if (!validateLogo(editForm.logo)) return;

    setUpdating(true);

    try {
      const response = await fetch(`${API_URL}/api/brands/${editingBrand.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(editForm),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Error al actualizar la marca");
        return;
      }

      closeEditModal();
      await loadBrands();
      toast.success("Marca actualizada correctamente");
    } catch (error) {
      console.error("Error actualizando marca:", error);
      toast.error("Error al actualizar la marca");
    } finally {
      setUpdating(false);
    }
  };

  // Elimina la marca seleccionada
  const handleDelete = async () => {
    if (!brandToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/brands/${brandToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Si hay error, mostramos mensaje controlado
      if (!response.ok) {
        const errorData = await response.json();

        if (import.meta.env.DEV) {
          console.warn("Error controlado:", errorData.error);
        }

        toast.error(
          errorData.error ||
            "Error al eliminar la marca. Puede que tenga productos asociados."
        );
        return;
      }

      await loadBrands();
      toast.success("Marca eliminada correctamente");
      setBrandToDelete(null);
    } catch (error) {
      console.error("Error REAL eliminando marca:", error);
      toast.error("Error de conexión");
    } finally {
      setDeleting(false);
    }
  };

  // Filtra las marcas por nombre, descripción o país
  const filteredBrands = brands.filter((brand) => {
    const term = searchTerm.toLowerCase();

    return (
      brand.name?.toLowerCase().includes(term) ||
      brand.description?.toLowerCase().includes(term) ||
      brand.originCountry?.toLowerCase().includes(term)
    );
  });

  // Pantalla de carga mientras se obtienen las marcas
  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando marcas...</p>
    </div>
  );
  }

  return (
    <section className="w-full max-w-full space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de marcas
        </h2>
        <p className="text-gray-600 mt-1">
          Crea, edita y administra las marcas de IComponents.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <BadgePlus size={22} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Crear nueva marca
          </h3>
        </div>

        <BrandFormFields form={form} onChange={handleChange} />

        <div className="flex justify-center sm:justify-start">
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {creating ? "Creando..." : "Crear marca"}
          </button>
        </div>
      </form>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">
            Marcas registradas
          </h3>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar marca..."
            className="w-full sm:max-w-sm border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredBrands.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600">No se encontraron marcas.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredBrands.map((brand) => (
                <BrandCard
                  key={brand.id}
                  brand={brand}
                  onEdit={openEditModal}
                  onDelete={setBrandToDelete}
                />
              ))}
            </div>

            <div className="hidden lg:block border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">País</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BrandLogo brand={brand} size="small" />

                          <span className="font-semibold text-gray-900">
                            {brand.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600 max-w-md">
                        <p className="line-clamp-1">
                          {brand.description || "Sin descripción"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {brand.originCountry || "Sin país"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(brand)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setBrandToDelete(brand)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar marca
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Modifica los datos de {editingBrand.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <BrandFormFields form={editForm} onChange={handleEditChange} />

              {editingBrand.logoUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Logo actual
                  </p>
                  <img
                    src={`${API_URL}${editingBrand.logoUrl}`}
                    alt={editingBrand.name}
                    className="w-28 h-28 object-contain rounded-xl border border-gray-200 bg-gray-50 p-2"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {updating ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(brandToDelete)}
        title="Eliminar marca"
        message={`¿Seguro que quieres eliminar la marca "${
          brandToDelete?.name || ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setBrandToDelete(null);
        }}
      />
    </section>
  );
};

// Componente reutilizable con los campos del formulario
const BrandFormFields = ({ form, onChange }) => {
  const inputClass =
    "w-full min-w-0 max-w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <input
          name="name"
          placeholder="Nombre de la marca"
          value={form.name}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="originCountry"
          placeholder="País de origen"
          value={form.originCountry}
          onChange={onChange}
          className={inputClass}
        />

        <input
          name="logo"
          type="file"
          accept="image/png"
          onChange={onChange}
          className={`${inputClass} bg-white text-sm md:col-span-2`}
        />
      </div>

      <textarea
        name="description"
        placeholder="Descripción"
        value={form.description}
        onChange={onChange}
        rows="3"
        className={inputClass}
      />
    </>
  );
};

// Componente que muestra el logo de una marca
const BrandLogo = ({ brand, size = "normal" }) => {
  const sizeClasses = size === "small" ? "w-12 h-12" : "w-20 h-20";

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center`}
    >
      {brand.logoUrl ? (
        <img
          src={`${API_URL}${brand.logoUrl}`}
          alt={brand.name}
          className="w-full h-full object-contain p-2"
        />
      ) : (
        <Tags size={22} className="text-gray-400" />
      )}
    </div>
  );
};

// Tarjeta de marca para vista responsive
const BrandCard = ({ brand, onEdit, onDelete }) => {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <BrandLogo brand={brand} />

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 truncate">
            {brand.name}
          </h4>

          <p className="text-sm text-gray-500 mt-1">
            {brand.originCountry || "Sin país"}
          </p>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {brand.description || "Sin descripción"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(brand)}
          className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
        >
          <Pencil size={16} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onDelete(brand)}
          className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-xl hover:bg-red-50 font-medium"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </article>
  );
};

export default AdminBrandsPage;