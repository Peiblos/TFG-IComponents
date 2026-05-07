import { useEffect, useState } from "react";
// Importamos el contexto de autenticación
import { useAuth } from "../context/AuthContext";
// Librería para mostrar notificaciones
import toast from "react-hot-toast";
// Iconos usados en la página
import {
  User,
  MapPin,
  Save,
  Plus,
  Pencil,
  Trash2,
  X,
  Home,
  Loader2
} from "lucide-react";
const API_URL = import.meta.env.VITE_URL_API;

// Estado inicial del formulario de usuario
const initialUserForm = {
  firstName: "",
  lastName: "",
  phone: "",
  password: "",
};

// Estado inicial del formulario de dirección
const initialAddressForm = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

const ProfilePage = () => {
  // Obtenemos el token del usuario autenticado
  const { token } = useAuth();
  // Datos completos del perfil
  const [profile, setProfile] = useState(null);
  // Formulario de datos personales
  const [userForm, setUserForm] = useState(initialUserForm);
  // Formulario para crear dirección
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  // Dirección que se está editando
  const [editingAddress, setEditingAddress] = useState(null);
  // Formulario para editar dirección
  const [editAddressForm, setEditAddressForm] = useState(initialAddressForm);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);

  // Carga el perfil del usuario desde la API
  const loadProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // Guardamos el perfil completo
      setProfile(data);

      // Rellenamos el formulario con los datos actuales del usuario
      setUserForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        password: "",
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al cargar la página, obtenemos el perfil
  useEffect(() => {
    loadProfile();
  }, []);

  // Maneja cambios en el formulario de usuario
  const handleUserChange = (e) => {
    setUserForm({
      ...userForm,
      [e.target.name]: e.target.value,
    });
  };

  // Maneja cambios en el formulario de creación de dirección
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setAddressForm({
      ...addressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEditAddressChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditAddressForm({
      ...editAddressForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Actualiza los datos personales del usuario
  const updateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    // Payload base con datos editables
    const payload = {
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      phone: userForm.phone,
    };

    // Solo enviamos contraseña si el usuario ha escrito una nueva
    if (userForm.password.trim()) {
      payload.password = userForm.password;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        toast.error("Error al actualizar el perfil");
        return;
      }

      toast.success("Perfil actualizado correctamente");
      await loadProfile();
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  // Crea una nueva dirección
  const createAddress = async (e) => {
    e.preventDefault();
    setCreatingAddress(true);

    try {
      const response = await fetch(`${API_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        toast.error("Error al crear la dirección");
        return;
      }

      // Reiniciamos formulario y recargamos perfil
      setAddressForm(initialAddressForm);
      await loadProfile();
    } catch (error) {
      console.error("Error creando dirección:", error);
      toast.error("Error al crear la dirección");
    } finally {
      setCreatingAddress(false);
    }
  };

  // Abre el modal de edición de dirección
  const openEditAddress = (address) => {
    setEditingAddress(address);
    setEditAddressForm({
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      postalCode: address.postalCode || "",
      country: address.country || "",
      isDefault: address.isDefault || false,
    });
  };

  // Cierra el modal de edición de dirección
  const closeEditAddress = () => {
    setEditingAddress(null);
    setEditAddressForm(initialAddressForm);
  };

  // Actualiza una dirección existente
  const updateAddress = async (e) => {
    e.preventDefault();

    if (!editingAddress) return;

    setUpdatingAddress(true);

    try {
      const response = await fetch(
        `${API_URL}/api/addresses/${editingAddress.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editAddressForm),
        }
      );

      if (!response.ok) {
        toast.error("Error al actualizar la dirección");
        return;
      }

      closeEditAddress();
      await loadProfile();
    } catch (error) {
      console.error("Error actualizando dirección:", error);
      toast.error("Error al actualizar la dirección");
    } finally {
      setUpdatingAddress(false);
    }
  };

  // Elimina una dirección
  const deleteAddress = async (addressId) => {
    const confirmDelete = confirm("¿Seguro que quieres eliminar esta dirección?");

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.error("Error al eliminar la dirección");
        return;
      }

      await loadProfile();
    } catch (error) {
      console.error("Error eliminando dirección:", error);
      toast.error("Error al eliminar la dirección");
    }
  };

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando perfil...</p>
    </div>
  );
  }

  return (
    <section className="space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Mi perfil</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus datos personales y direcciones.
        </p>
      </div>

      <form
        onSubmit={updateProfile}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <User size={22} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Datos personales</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="firstName"
            placeholder="Nombre"
            value={userForm.firstName}
            onChange={handleUserChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="lastName"
            placeholder="Apellidos"
            value={userForm.lastName}
            onChange={handleUserChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="phone"
            placeholder="Teléfono"
            value={userForm.phone}
            onChange={handleUserChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            name="password"
            type="password"
            placeholder="Nueva contraseña opcional"
            value={userForm.password}
            onChange={handleUserChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p className="text-sm text-gray-500">
          Email: <span className="font-medium">{profile?.email}</span>
        </p>

        <button
          type="submit"
          disabled={savingProfile}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save size={18} />
          {savingProfile ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <form
        onSubmit={createAddress}
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <MapPin size={22} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Añadir dirección
          </h2>
        </div>

        <AddressFormFields form={addressForm} onChange={handleAddressChange} />

        <button
          type="submit"
          disabled={creatingAddress}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {creatingAddress ? "Añadiendo..." : "Añadir dirección"}
        </button>
      </form>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Mis direcciones
        </h2>

        {profile?.addresses?.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <Home size={38} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">Todavía no tienes direcciones.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {profile.addresses.map((address) => (
              <article
                key={address.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {address.street}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      {address.postalCode} {address.city}
                    </p>

                    <p className="text-sm text-gray-600">
                      {address.state}, {address.country}
                    </p>

                    {address.isDefault && (
                      <span className="inline-block mt-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        Dirección principal
                      </span>
                    )}
                  </div>

                  <MapPin size={22} className="text-blue-600 shrink-0" />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => openEditAddress(address)}
                    className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() => deleteAddress(address.id)}
                    className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-xl hover:bg-red-50 font-medium"
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {editingAddress && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar dirección
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Modifica los datos de esta dirección.
                </p>
              </div>

              <button
                onClick={closeEditAddress}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={updateAddress} className="space-y-5">
              <AddressFormFields
                form={editAddressForm}
                onChange={handleEditAddressChange}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditAddress}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={updatingAddress}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {updatingAddress ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

// Componente reutilizable con los campos de una dirección
const AddressFormFields = ({ form, onChange }) => {
  const inputClass =
    "w-full min-w-0 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="street"
          placeholder="Calle y número"
          value={form.street}
          onChange={onChange}
          required
          className={`${inputClass} md:col-span-2`}
        />

        <input
          name="city"
          placeholder="Ciudad"
          value={form.city}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="state"
          placeholder="Provincia / Estado"
          value={form.state}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="postalCode"
          placeholder="Código postal"
          value={form.postalCode}
          onChange={onChange}
          required
          className={inputClass}
        />

        <input
          name="country"
          placeholder="País"
          value={form.country}
          onChange={onChange}
          required
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={onChange}
          className="w-4 h-4"
        />
        Usar como dirección principal
      </label>
    </>
  );
};

export default ProfilePage;