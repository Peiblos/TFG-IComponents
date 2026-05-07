import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  FolderPlus,
  FolderTree,
  Pencil,
  Trash2,
  X,
  Save,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_URL_API;

// Estado inicial del formulario
const initialForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

const AdminCategoriesPage = () => {
  // Obtenemos el token del usuario admin
  const { token } = useAuth();
  // Lista de categorías
  const [categories, setCategories] = useState([]);
  // Formulario de creación
  const [form, setForm] = useState(initialForm);
  // Formulario de edición
  const [editForm, setEditForm] = useState(initialForm);
  // Categoría que se está editando
  const [editingCategory, setEditingCategory] = useState(null);
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  // Buscador de categorías
  const [searchTerm, setSearchTerm] = useState("");
  // Categoría seleccionada para eliminar
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  // Estado de eliminación
  const [deleting, setDeleting] = useState(false);
  // Carga todas las categorías desde la API
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    } finally {
      setLoading(false);
    }
  };
  // Al cargar la página, obtenemos las categorías
  useEffect(() => {
    loadCategories();
  }, []);

  // Devuelve el nombre de la categoría padre
  const getParentName = (parentId) => {
    if (!parentId) return "Sin padre";
    const parent = categories.find((category) => category.id === parentId);
    return parent ? parent.name : "Sin padre";
  };

  // Maneja cambios del formulario de creación
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Maneja cambios del formulario de edición
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // Cambia la categoría padre en el formulario de creación
  const handleParentChange = (value) => {
    setForm({
      ...form,
      parentId: value,
    });
  };

  // Cambia la categoría padre en el formulario de edición
  const handleEditParentChange = (value) => {
    setEditForm({
      ...editForm,
      parentId: value,
    });
  };

  // Prepara los datos que se enviarán al backend
  const buildPayload = (data) => ({
    name: data.name,
    slug: data.slug || null,
    description: data.description || null,
    parentId: data.parentId ? Number(data.parentId) : null,
  });

  // Crea una nueva categoría
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload(form)),
      });

      if (!response.ok) {
        toast.error("Error al crear la categoría");
        return;
      }

      setForm(initialForm);
      await loadCategories();
      toast.success("Categoría creada correctamente");
    } catch (error) {
      console.error("Error creando categoría:", error);
      toast.error("Error al crear la categoría");
    } finally {
      setCreating(false);
    }
  };

  // Abre el modal de edición con los datos de la categoría seleccionada
  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      parentId: category.parentId || "",
    });
  };

  // Cierra el modal de edición
  const closeEditModal = () => {
    setEditingCategory(null);
    setEditForm(initialForm);
  };

  // Actualiza una categoría existente
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingCategory) return;

    setUpdating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/categories/${editingCategory.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(buildPayload(editForm)),
        }
      );

      if (!response.ok) {
        toast.error("Error al actualizar la categoría");
        return;
      }

      closeEditModal();
      await loadCategories();
      toast.success("Categoría actualizada correctamente");
    } catch (error) {
      console.error("Error actualizando categoría:", error);
      toast.error("Error al actualizar la categoría");
    } finally {
      setUpdating(false);
    }
  };

  // Elimina la categoría seleccionada
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/categories/${categoryToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        toast.error(
          "Error al eliminar la categoría. Puede que tenga productos asociados."
        );
        return;
      }

      await loadCategories();
      toast.success("Categoría eliminada correctamente");
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Error eliminando categoría:", error);
      toast.error("Error al eliminar la categoría");
    } finally {
      setDeleting(false);
    }
  };

  // Opciones de categoría padre.
  // En edición se excluye la propia categoría para evitar que sea padre de sí misma.
  const parentOptions = categories.filter(
    (category) => category.id !== editingCategory?.id
  );

  // Filtra categorías por nombre, slug, descripción o categoría padre
  const filteredCategories = categories.filter((category) => {
    const term = searchTerm.toLowerCase();

    return (
      category.name?.toLowerCase().includes(term) ||
      category.slug?.toLowerCase().includes(term) ||
      category.description?.toLowerCase().includes(term) ||
      getParentName(category.parentId)?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando categorías...</p>
    </div>
  );
  }

  return (
    <section className="w-full max-w-full space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de categorías
        </h2>
        <p className="text-gray-600 mt-1">
          Crea, edita y organiza las categorías del catálogo.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <FolderPlus size={22} className="text-blue-600 shrink-0" />
          <h3 className="text-lg font-semibold text-gray-900">
            Crear nueva categoría
          </h3>
        </div>

        <CategoryFormFields
          form={form}
          categories={categories}
          onChange={handleChange}
          onParentChange={handleParentChange}
        />

        <div className="flex justify-center sm:justify-start">
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {creating ? "Creando..." : "Crear categoría"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center sm:text-left">
          Categorías registradas
        </h3>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categoría por nombre, slug o padre..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600">Todavía no hay categorías.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  parentName={getParentName(category.parentId)}
                  onEdit={openEditModal}
                  onDelete={setCategoryToDelete}
                />
              ))}
            </div>

            <div className="hidden lg:block border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Slug</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Padre
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon />
                          <span className="font-semibold text-gray-900">
                            {category.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {category.slug ? `${category.slug}` : "Sin slug"}
                      </td>

                      <td className="px-4 py-3 text-gray-600 max-w-md">
                        <p className="line-clamp-1">
                          {category.description || "Sin descripción"}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {getParentName(category.parentId)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(category)}
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

      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar categoría
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Modifica los datos de {editingCategory.name}.
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
              <CategoryFormFields
                form={editForm}
                categories={parentOptions}
                onChange={handleEditChange}
                onParentChange={handleEditParentChange}
              />

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
        open={Boolean(categoryToDelete)}
        title="Eliminar categoría"
        message={`¿Seguro que quieres eliminar la categoría "${
          categoryToDelete?.name || ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setCategoryToDelete(null);
        }}
      />
    </section>
  );
};

const CategoryFormFields = ({ form, categories, onChange, onParentChange }) => {
  const inputClass =
    "w-full min-w-0 max-w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <input
          name="name"
          placeholder="Nombre de la categoría"
          value={form.name}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="slug"
          placeholder="Slug, ejemplo: monitores"
          value={form.slug}
          onChange={onChange}
          className={inputClass}
        />

        <div className="md:col-span-2 min-w-0">
          <CategoryParentDropdown
            categories={categories}
            value={form.parentId}
            onChange={onParentChange}
          />
        </div>
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

const CategoryParentDropdown = ({ categories, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const hierarchicalCategories = useMemo(() => {
    const result = [];

    const addChildren = (parentId = null, level = 0) => {
      categories
        .filter((category) => (category.parentId || null) === parentId)
        .forEach((category) => {
          result.push({ ...category, level });
          addChildren(category.id, level + 1);
        });
    };

    addChildren(null);
    return result;
  }, [categories]);

  const selectedCategory = categories.find(
    (category) => String(category.id) === String(value)
  );

  const filteredCategories = hierarchicalCategories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (categoryId) => {
    onChange(categoryId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="truncate text-gray-700">
          {selectedCategory ? selectedCategory.name : "Sin categoría padre"}
        </span>
        <ChevronDown size={18} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-3 border-b">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-100 ${
                !value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
              }`}
            >
              Sin categoría padre
            </button>

            {filteredCategories.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-500">
                No se encontraron categorías.
              </p>
            ) : (
              filteredCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => handleSelect(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-100 flex items-center gap-2 ${
                    String(value) === String(category.id)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700"
                  }`}
                  style={{ paddingLeft: `${12 + category.level * 18}px` }}
                >
                  <FolderTree size={16} className="shrink-0" />
                  <span className="truncate">{category.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CategoryIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
    <FolderTree size={20} />
  </div>
);

const CategoryCard = ({ category, parentName, onEdit, onDelete }) => {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <CategoryIcon />

        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 truncate">
            {category.name}
          </h4>

          <p className="text-sm text-gray-500 mt-1">
            {category.slug ? `/${category.slug}` : "Sin slug"}
          </p>

          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {category.description || "Sin descripción"}
          </p>

          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
            Padre: {parentName}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
        >
          <Pencil size={16} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onDelete(category)}
          className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-xl hover:bg-red-50 font-medium"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </article>
  );
};

export default AdminCategoriesPage;