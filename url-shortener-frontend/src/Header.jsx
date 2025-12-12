// src/Header.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Header({ loggedIn, setLoggedIn }) {
  const navigate = useNavigate();

  async function logout() {
    await fetch("http://localhost:8080/api/logout", {
      method: "POST",
      credentials: "include"
    });
    setLoggedIn(false);
    navigate("/");
  }

  return (
    <header style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "15px 25px",
      borderBottom: "1px solid #ddd"
    }}>
      <Link to="/" style={{ fontSize: 22, fontWeight: "bold" }}>
        🚀 Shortify
      </Link>

      <nav style={{ display: "flex", gap: 15 }}>
        {!loggedIn && (
          <>
            <Link to="/login">Connexion</Link>
            <Link to="/register">Créer un compte</Link>
          </>
        )}

        {loggedIn && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout}>Déconnexion</button>
          </>
        )}
      </nav>
    </header>
  );
}
