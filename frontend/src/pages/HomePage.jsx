import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Nearby</h1>
        <p className="mt-2 text-slate-400">
          You are logged in as {user.name}. Role: {user.role}. Civic score: {user.civicScore}.
        </p>
        <p className="mt-4 text-slate-300">
          The nearby feed will list issues here. For now, file a report.
        </p>
        <Link
          to="/report"
          className="mt-6 inline-block rounded bg-sky-600 px-4 py-2 font-medium text-white"
        >
          Report a problem
        </Link>
      </main>
    </div>
  );
}
