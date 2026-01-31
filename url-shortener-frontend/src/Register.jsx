import { useState } from "react";
import "./Form.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/api/register", {
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

      setMessage("Inscription réussie ! Vous pouvez vous connecter.");
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h2>Créer un compte 🚀</h2>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              placeholder="Choisissez un mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">S'inscrire</button>
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