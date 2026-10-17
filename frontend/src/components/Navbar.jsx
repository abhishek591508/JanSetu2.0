import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();//useNavigate is a hook that allows you to navigate to a different page

  function onLogout() {
    handleLogout();
    navigate("/login");
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-white">
          JanSetu
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/report" className="text-sky-400">
            Report
          </Link>
          <span className="text-slate-400">{user?.name}</span>
          <button onClick={onLogout} className="text-slate-300">
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}
