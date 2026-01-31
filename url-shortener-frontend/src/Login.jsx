import { useState } from "react";
import { BACKEND_URL } from "./config";
import "./Form.css";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue");
        return;
      }

      setMessage("Connexion réussie !");
      setTimeout(() => onLoginSuccess(), 500); 

    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h2>Bienvenue 👋</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Se connecter</button>
        </form>

        {message && (
          <div className={`message-box ${message.includes("réussie") ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}