import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { Pencil, Trash2, X, Save, Users, Search, Shield, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_URL_API;

// Estado inicial del formulario de edición de usuario
const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  roles: ["ROLE_USER"],
};

// Devuelve la dirección marcada como principal
const getDefaultAddress = (user) => {
  return user.addresses?.find((address) => address.isDefault) || null;
};

// Formatea una dirección para mostrarla como texto
const formatAddress = (address) => {
  if (!address) return "Sin dirección principal";

  return [
    address.street,
    address.postalCode,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const AdminUsersPage = () => {
  // Obtenemos el token y el usuario actual
  const { token, user: currentUser } = useAuth();
  // Lista de usuarios
  const [users, setUsers] = useState([]);
  // Texto del buscador
  const [searchTerm, setSearchTerm] = useState("");
  // Usuario que se está editando
  const [editingUser, setEditingUser] = useState(null);
  // Formulario de edición
  const [editForm, setEditForm] = useState(initialForm);
  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  // Usuario seleccionado para eliminar
  const [userToDelete, setUserToDelete] = useState(null);
  // Estado de eliminación
  const [deleting, setDeleting] = useState(false);

  // Carga todos los usuarios desde la API
  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Al cargar la página, obtenemos los usuarios
  useEffect(() => {
    loadUsers();
  }, []);

  // Abre el modal de edición con los datos del usuario seleccionado
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      roles: user.roles || ["ROLE_USER"],
    });
  };

  // Cierra el modal de edición
  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm(initialForm);
  };

  // Maneja cambios en los inputs del formulario
  const handleChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  // Añade o quita el rol de administrador
  const toggleAdminRole = () => {
    const hasAdmin = editForm.roles.includes("ROLE_ADMIN");

    setEditForm({
      ...editForm,
      roles: hasAdmin
        ? editForm.roles.filter((role) => role !== "ROLE_ADMIN")
        : [...editForm.roles, "ROLE_ADMIN"],
    });
  };

  // Actualiza los datos del usuario
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        toast.error("Error al actualizar el usuario");
        return;
      }

      closeEditModal();
      await loadUsers();
      toast.success("Usuario actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      toast.error("Error al actualizar el usuario");
    } finally {
      setUpdating(false);
    }
  };

  // Elimina el usuario seleccionado
  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.details || error.error || "Error al eliminar el usuario");
        return;
      }

      await loadUsers();
      toast.success("Usuario eliminado correctamente");
      setUserToDelete(null);
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      toast.error("Error al eliminar el usuario");
    } finally {
      setDeleting(false);
    }
  };
  // Filtra usuarios por email, nombre, apellidos o teléfono
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();

    return (
      user.email?.toLowerCase().includes(term) ||
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-gray-500">Cargando usuarios...</p>
    </div>
  );
  }

  return (
    <section className="w-full max-w-full space-y-8">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestión de usuarios
        </h2>
        <p className="text-gray-600 mt-1">
          Consulta, edita roles y administra los usuarios registrados.
        </p>
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-bold text-gray-900 text-center sm:text-left">
            Usuarios registrados
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
              placeholder="Buscar usuario..."
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
            <Users size={38} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No se encontraron usuarios.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  onEdit={openEditModal}
                  onDelete={setUserToDelete}
                />
              ))}
            </div>

            <div className="hidden lg:block border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Dirección principal
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Registro
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const defaultAddress = getDefaultAddress(user);

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`
                                : "Sin nombre"}
                            </p>
                            <p className="text-gray-500">{user.email}</p>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {user.phone || "Sin teléfono"}
                        </td>

                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          {formatAddress(defaultAddress)}
                        </td>

                        <td className="px-4 py-3">
                          <RoleBadges roles={user.roles} />
                        </td>

                        <td className="px-4 py-3 text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Pencil size={16} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => setUserToDelete(user)}
                              disabled={currentUser?.id === user.id}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={16} />
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Editar usuario
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Modifica los datos de {editingUser.email}.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  placeholder="Nombre"
                  value={editForm.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="lastName"
                  placeholder="Apellidos"
                  value={editForm.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  name="phone"
                  placeholder="Teléfono"
                  value={editForm.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={20} className="text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Roles</h4>
                </div>

                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editForm.roles.includes("ROLE_ADMIN")}
                    onChange={toggleAdminRole}
                    className="w-4 h-4"
                  />
                  Administrador
                </label>

                <p className="text-xs text-gray-500 mt-2">
                  Todos los usuarios mantienen automáticamente ROLE_USER.
                </p>
              </div>

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
        open={Boolean(userToDelete)}
        title="Eliminar usuario"
        message={`¿Seguro que quieres eliminar al usuario "${
          userToDelete?.email || ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setUserToDelete(null);
        }}
      />
    </section>
  );
};

// Tarjeta responsive para mostrar usuarios en móvil/tablet
const UserCard = ({ user, currentUser, onEdit, onDelete }) => {
  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div>
        <h4 className="font-semibold text-gray-900">
          {user.firstName || user.lastName
            ? `${user.firstName || ""} ${user.lastName || ""}`
            : "Sin nombre"}
        </h4>

        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
        <p className="text-sm text-gray-500 mt-1">
          {user.phone || "Sin teléfono"}
        </p>

        <div className="mt-3">
          <RoleBadges roles={user.roles} />
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Registro: {formatDate(user.createdAt)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-medium"
        >
          <Pencil size={16} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onDelete(user)}
          disabled={currentUser?.id === user.id}
          className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-xl hover:bg-red-50 font-medium disabled:text-gray-400 disabled:border-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </article>
  );
};

// Muestra los roles del usuario como etiquetas visuales
const RoleBadges = ({ roles = [] }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            role === "ROLE_ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {role === "ROLE_ADMIN" ? "Admin" : "Usuario"}
        </span>
      ))}
    </div>
  );
};

// Formatea la fecha en formato español
const formatDate = (date) => {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default AdminUsersPage;