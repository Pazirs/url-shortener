// src/Home.jsx

import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1>Raccourcissez vos liens. Analysez vos clics.</h1>

      <p style={{ fontSize: 18, marginTop: 10 }}>
        Un raccourcisseur d’URL intelligent avec statistiques détaillées.
      </p>

      <Link
        to="/login"
        style={{
          marginTop: 30,
          display: "inline-block",
          padding: "12px 25px",
          background: "#007bff",
          color: "#fff",
          borderRadius: 8,
        }}
      >
        Commencer maintenant
      </Link>
    </div>
  );
}
