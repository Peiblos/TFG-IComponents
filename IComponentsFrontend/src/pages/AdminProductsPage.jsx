import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  Trash2,
  PackagePlus,
  Pencil,
  X,
  Save,
  ChevronDown,
  Search,
  FolderTree,
  Tags,
  Loader2
} from "lucide-react";

const API_URL = import.meta.env.VITE_URL_API;
// Estado inicial del formulario de producto
const initialForm = {
  name: "",
  description: "",
  price: "",
  discount: "",
  stock: "",
  categoryId: "",
  brandId: "",
  image: null,
  isActive: true,
  manufacturerReference: "",
};
// Opciones posibles para activar o archivar un producto
const statusOptions = [
  { id: 1, name: "Activo" },
  { id: 0, name: "Archivado" },
];

const AdminProductsPage = () => {
  // Obtenemos el token del usuario administrador
  const { token } = useAuth();
  // Listas necesarias para gestionar productos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  // Formulario de creación
  const [form, setForm] = useState(initialForm);
  // Formulario de edición
  const [editForm, setEditForm] = useState(initialForm);
  // Producto que se está editando
  const [editingProduct, setEditingProduct] = useState(null);
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  // Texto del buscador
  const [searchTerm, setSearchTerm] = useState("");
  // Producto seleccionado para eliminar
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Estado de eliminación
  const [deleting, setDeleting] = useState(false);

  // Carga productos desde la API
  const loadProducts = async () => {
    const response = await fetch(`${API_URL}/api/products`);
    const data = await response.json();
    setProducts(data);
  };

  // Carga categorías desde la API
  const loadCategories = async () => {
    const response = await fetch(`${API_URL}/api/categories`);
    const data = await response.json();
    setCategories(data);
  };

  // Carga marcas desde la API
  const loadBrands = async () => {
    const response = await fetch(`${API_URL}/api/brands`);
    const data = await response.json();
    setBrands(data);
  };

  // Al cargar la página, cargamos productos, categorías y marcas a la vez
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadProducts(), loadCategories(), loadBrands()]);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Maneja cambios del formulario de creación
  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm({
      ...form,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // Maneja cambios del formulario de edición
  const handleEditChange = (e) => {
    const { name, value, files, type } = e.target;

    setEditForm({
      ...editForm,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // Maneja dropdowns del formulario de creación
  const handleSelectChange = (name, value) => {
    setForm({
      ...form,
      [name]: value,
    });
  };

  // Maneja dropdowns del formulario de edición
  const handleEditSelectChange = (name, value) => {
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Construye un FormData para enviar datos e imagen al backend
  const buildFormData = (data) => {
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", data.price);
    formData.append("discount", data.discount || 0);
    formData.append("stock", data.stock);
    formData.append("categoryId", data.categoryId);
    formData.append("brandId", data.brandId);
    formData.append("isActive", data.isActive ? "1" : "0");
    formData.append("manufacturerReference", data.manufacturerReference || "");

    // Solo añadimos imagen si el usuario ha seleccionado una
    if (data.image) {
      formData.append("image", data.image);
    }

    return formData;
  };

  // Valida campos obligatorios que no son inputs normales
  const validateProductForm = (data) => {
    if (!data.categoryId) {
      toast.error("Selecciona una categoría");
      return false;
    }

    if (!data.brandId) {
      toast.error("Selecciona una marca");
      return false;
    }

    return true;
  };

  // Crea un producto nuevo
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateProductForm(form)) return;
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(form),
      });

      if (!response.ok) {
        toast.error("Error al crear el producto");
        return;
      }

      setForm(initialForm);
      e.target.reset();
      await loadProducts();
      toast.success("Producto creado correctamente");
    } catch (error) {
      console.error("Error creando producto:", error);
      toast.error("Error al crear el producto");
    } finally {
      setCreating(false);
    }
  };

  // Abre el modal de edición y rellena el formulario con los datos del producto
  const openEditModal = (product) => {
    const category = categories.find((cat) => cat.name === product.category);
    const brand = brands.find((brand) => brand.name === product.brand);

    setEditingProduct(product);

    setEditForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      discount: product.discount || "",
      stock: product.stock || "",
      categoryId: category?.id || "",
      brandId: brand?.id || "",
      image: null,
      isActive: product.isActive,
      manufacturerReference: product.manufacturerReference || "",
    });
  };

  // Cierra el modal de edición
  const closeEditModal = () => {
    setEditingProduct(null);
    setEditForm(initialForm);
  };

  // Actualiza un producto existente
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingProduct) return;
    if (!validateProductForm(editForm)) return;

    setUpdating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/products/${editingProduct.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: buildFormData(editForm),
        }
      );

      if (!response.ok) {
        toast.error("Error al actualizar el producto");
        return;
      }

      closeEditModal();
      await loadProducts();
      toast.success("Producto actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      toast.error("Error al actualizar el producto");
    } finally {
      setUpdating(false);
    }
  };

  // Elimina el producto seleccionado
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al eliminar el producto");
        return;
      }

      toast.success("Producto eliminado correctamente");
      setDeleteTarget(null);
      await loadProducts();
    } catch (error) {
      console.error("Error eliminando producto:", error);
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  // Filtra productos por nombre, descripción, categoría, marca, SKU o referencia
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();

    return (
      product.name?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term) ||
      product.brand?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.manufacturerReference?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando productos...</p>
    </div>
  );
  }

  return (
    <section className="w-full max-w-full space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de productos
        </h2>
        <p className="text-gray-600 mt-1">
          Crea, revisa y administra los productos de IComponents.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-5"
      >
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <PackagePlus size={22} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Crear nuevo producto
          </h3>
        </div>

        <ProductFormFields
          form={form}
          categories={categories}
          brands={brands}
          onChange={handleChange}
          onSelectChange={handleSelectChange}
        />

        <div className="flex justify-center sm:justify-start">
          <button
            type="submit"
            disabled={creating}
            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {creating ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center sm:text-left">
          Productos registrados
        </h3>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto por nombre, categoría o marca..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-gray-600">No se encontraron productos.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={openEditModal}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>

            <div className="hidden lg:block border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/products/${product.id}`}>
                            <ProductImage product={product} size="small" />
                          </Link>

                          <div className="min-w-0">
                            <Link
                              to={`/products/${product.id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition"
                            >
                              {product.name}
                            </Link>

                            <div className="mt-1 space-y-0.5">
                              {product.sku && (
                                <p className="text-xs text-gray-400">
                                  SKU: {product.sku}
                                </p>
                              )}

                              {product.manufacturerReference && (
                                <p className="text-xs text-gray-500">
                                  Ref: {product.manufacturerReference}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {product.category || "Sin categoría"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {product.brand || "Sin marca"}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-blue-600">
                          {product.price}€
                        </p>
                        {product.discount > 0 && (
                          <span className="inline-block mt-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                            -{product.discount}%
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <StockBadge stock={product.stock} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          {/* <button
                            onClick={() => setDeleteTarget(product)}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                          >
                            <Trash2 size={16} />
                            Eliminar
                          </button> */}
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

      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar producto
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Modifica los datos de {editingProduct.name}.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <ProductFormFields
                form={editForm}
                categories={categories}
                brands={brands}
                onChange={handleEditChange}
                onSelectChange={handleEditSelectChange}
                showStatus={true}
              />

              {editingProduct.imageUrl && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Imagen actual
                  </p>
                  <img
                    src={`${API_URL}${editingProduct.imageUrl}`}
                    alt={editingProduct.name}
                    className="w-28 h-28 object-cover rounded-xl border border-gray-200"
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
                {/* <button
                  type="button"
                  onClick={() => setDeleteTarget(editingProduct)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  <Trash2 size={18} />
                  Eliminar
                </button> */}
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Seguro que quieres eliminar "${
          deleteTarget?.name || "este producto"
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar producto"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
};

// Componente reutilizable con los campos del formulario de producto
const ProductFormFields = ({
  form,
  categories,
  brands,
  onChange,
  onSelectChange,
  showStatus = false,
}) => {
  const inputClass =
    "w-full min-w-0 max-w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <input
          name="name"
          placeholder="Nombre del producto"
          value={form.name}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.price}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="discount"
          type="number"
          min="0"
          max="100"
          placeholder="Descuento (%)"
          value={form.discount}
          onChange={onChange}
          className={inputClass}
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onChange}
          className={`${inputClass} bg-white text-sm`}
        />

        <CustomDropdown
          label="Categoría"
          placeholder="Selecciona una categoría"
          value={form.categoryId}
          options={categories}
          icon={FolderTree}
          onChange={(value) => onSelectChange("categoryId", value)}
        />

        <CustomDropdown
          label="Marca"
          placeholder="Selecciona una marca"
          value={form.brandId}
          options={brands}
          icon={Tags}
          onChange={(value) => onSelectChange("brandId", value)}
        />

        <input
          name="manufacturerReference"
          placeholder="Referencia fabricante"
          value={form.manufacturerReference}
          onChange={onChange}
          className={inputClass}
        />

        {showStatus && (
          
          <CustomDropdown
          label="Estado"
          placeholder="Selecciona estado"
          value={form.isActive ? 1 : 0}
          options={statusOptions}
          icon={PackagePlus} 
          onChange={(value) => onSelectChange("isActive", value === 1)}
        />
  
        )}
      </div>

      <textarea
        name="description"
        placeholder="Descripción"
        value={form.description}
        onChange={onChange}
        required
        rows="3"
        className={inputClass}
      />
    </>
  );
};

// Dropdown reutilizable para categoría, marca y estado
const CustomDropdown = ({
  label,
  placeholder,
  value,
  options,
  icon: Icon,
  onChange,
}) => {
  // Estado para abrir/cerrar el desplegable
  const [open, setOpen] = useState(false);
  // Texto del buscador interno
  const [search, setSearch] = useState("");
  // Busca la opción seleccionada actualmente
  const selectedOption = options.find(
    (option) => String(option.id) === String(value)
  );
  // Filtra opciones según el texto escrito
  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  // Selecciona una opción y cierra el dropdown
  const handleSelect = (optionId) => {
    onChange(optionId);
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
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={18} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {label}
            </p>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder={`Buscar ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-500">
                No se encontraron resultados.
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-gray-100 flex items-center gap-2 ${
                    String(value) === String(option.id)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{option.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar la imagen del producto
const ProductImage = ({ product, size = "normal" }) => {
  const sizeClasses = size === "small" ? "w-14 h-14" : "w-24 h-24";

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-gray-100 overflow-hidden shrink-0`}
    >
      {product.imageUrl ? (
        <img
          src={`${API_URL}${product.imageUrl}`}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
          Sin img
        </div>
      )}
    </div>
  );
};

// Etiqueta visual del stock
const StockBadge = ({ stock }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {stock > 0 ? `${stock} unidades` : "Sin stock"}
    </span>
  );
};

// Tarjeta responsive para producto en móvil/tablet
const ProductCard = ({ product, onEdit, onDelete }) => {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="flex gap-4">
        <Link to={`/products/${product.id}`}>
          <ProductImage product={product} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${product.id}`}
            className="font-semibold text-gray-900 hover:text-blue-600 transition truncate block"
          >
            {product.name}
          </Link>

          {product.sku && (
            <p className="text-xs text-gray-400 mt-1">
              SKU: {product.sku}
            </p>
          )}

          {product.manufacturerReference && (
            <p className="text-xs text-gray-500">
              Ref: {product.manufacturerReference}
            </p>
          )}

          <p className="text-sm text-gray-500 mt-2">
            {product.category || "Sin categoría"}
          </p>

          <p className="text-sm text-gray-500">
            Marca: {product.brand || "Sin marca"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-blue-600">{product.price}€</p>
          {product.discount > 0 && (
            <span className="inline-block mt-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
              -{product.discount}%
            </span>
          )}
        </div>

        <StockBadge stock={product.stock} />
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-1 gap-2">
        <button
          onClick={() => onEdit(product)}
          className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>
    </article>
  );
};

export default AdminProductsPage;