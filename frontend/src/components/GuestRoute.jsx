import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-6 text-slate-300">Checking your login...</p>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
