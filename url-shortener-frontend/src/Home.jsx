import { Link } from "react-router-dom";
import "./Home.css"; // nouveau fichier CSS

export default function Home() {
  return (
    <div className="home-container">
      <h1>Raccourcissez vos liens. Analysez vos clics.</h1>
      <p className="home-subtitle">
        Un raccourcisseur d’URL intelligent avec statistiques détaillées.
      </p>
      <Link to="/login" className="home-button">
        Commencer maintenant
      </Link>
    </div>
  );
}
