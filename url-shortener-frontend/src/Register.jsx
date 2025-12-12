// src/Register.jsx
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
    <div>
      <h2>Créer un compte</h2>
      <form onSubmit={handleRegister}>
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
        <button type="submit">S'inscrire</button>
      </form>

      {message && (
  <p className={message.includes("réussie") ? "success" : ""}>{message}</p>
)}
    </div>
  );
}
