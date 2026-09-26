import { useEffect, useState } from "react";
import { getMe, login, logout, signup } from "./api";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    getMe()
      .then((data) => {
        setUser(data.user);
        setScreen("home");
      })
      .catch(() => {
        logout();
        setUser(null);
        setScreen("login");
      });
  }, []);

  async function handleSignup(event) {
    event.preventDefault();//prevent the default behavior of the form so that the page does not refresh when the form is submitted
    setMessage("");

    try {
      await signup(name, email, password);
      setMessage("Account created. Log in.");
      setScreen("login");
      setPassword("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    try {
      const data = await login(email, password);
      const me = await getMe();
      setUser(me.user);
      setScreen("home");
    } catch (error) {
      console.log("Problem while login at frontend")
      setMessage(error.message);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
    setScreen("login");
    setMessage("");
  }

  if (screen === "home" && user) {
    return (
      <main className="page">
        <h1>JanSetu</h1>
        <p>You are logged in.</p>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <p>Civic score: {user.civicScore}</p>
        <button onClick={handleLogout}>Log out</button>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>JanSetu</h1>
      <p>{screen === "login" ? "Log in" : "Create an account"}</p>

      <form onSubmit={screen === "login" ? handleLogin : handleSignup}>
        {screen === "signup" && (
          <input
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit">
          {screen === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      {screen === "login" ? (
        <button className="link" onClick={() => setScreen("signup")}>
          Need an account? Sign up
        </button>
      ) : (
        <button className="link" onClick={() => setScreen("login")}>
          Already have an account? Log in
        </button>
      )}
    </main>
  );
}