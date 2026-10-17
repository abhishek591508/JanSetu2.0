import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-6 text-slate-300">Checking your login...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;//replace the current page ie no back button
  }

  return children;
}