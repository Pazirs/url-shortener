import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "./config";
import "./Header.css";

export default function Header({ loggedIn, setLoggedIn }) {
  const navigate = useNavigate();

  async function logout() {
    try {
      await fetch(`${BACKEND_URL}/api/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
        console.error("Erreur lors de la déconnexion", error);
    }
    setLoggedIn(false);
    navigate("/");
  }

  return (
    <header className="header">
      <Link to="/" className="logo">🚀 Shortify</Link>
      <nav className="nav">
        {!loggedIn && (
          <>
            <Link to="/login" className="nav-link">Connexion</Link>
            <Link to="/register" className="nav-link">Créer un compte</Link>
          </>
        )}
        {loggedIn && (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <button onClick={logout} className="logout-button">Déconnexion</button>
          </>
        )}
      </nav>
    </header>
  );
}