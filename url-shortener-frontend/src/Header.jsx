import { Link, useNavigate } from "react-router-dom";
import "./Header.css"; // nouveau fichier CSS

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
