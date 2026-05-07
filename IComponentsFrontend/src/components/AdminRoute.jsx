import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.roles?.includes("ROLE_ADMIN")) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;