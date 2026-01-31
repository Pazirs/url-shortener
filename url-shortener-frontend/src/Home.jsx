import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container fade-in">
      <h1>
        Raccourcissez vos liens.<br />
        {/* on applique le style dégradé défini dans le CSS */}
        <span className="highlight">Analysez vos clics.</span>
      </h1>
      <p className="home-subtitle">
        Une plateforme performante pour gérer vos URLs, générer des QR Codes et suivre votre audience en temps réel.
      </p>
      <Link to="/login" className="home-button">
        Commencer gratuitement
      </Link>
    </div>
  );
}