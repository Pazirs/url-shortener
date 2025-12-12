// src/Login.jsx
import { useState } from "react";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        credentials: "include", // IMPORTANT pour le cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue");
        return;
      }

      setMessage("Connexion réussie !");
      onLoginSuccess(); // Passe à Dashboard

    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  return (
    <div>
      <h2>Connexion</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        /><br/>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
        /><br/>
        <button type="submit">Se connecter</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
