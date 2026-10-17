import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function SignupPage() {
  const { handleSignup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      await handleSignup(name, email, password);
      navigate("/login");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-slate-950 px-4 py-10 text-slate-100">
      <h1 className="text-2xl font-semibold">Create an account</h1>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <button
          disabled={submitting}
          className="rounded bg-sky-600 px-3 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Sign up"}
        </button>
      </form>

      {message && <p className="mt-3 text-red-400">{message}</p>}

      <Link to="/login" className="mt-4 inline-block text-sky-400">
        Already have an account? Log in
      </Link>
    </main>
  );
}
