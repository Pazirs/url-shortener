import React, { useState } from "react";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");

  const handleShorten = async () => {
    setError("");
    setShortUrl("");

    if (!url) {
      setError("Veuillez entrer une URL !");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // pour envoyer le cookie de session
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();

        if (response.status === 401) {
          setError("Vous devez être connecté pour raccourcir une URL.");
        } else if (response.status >= 500) {
          setError("Erreur serveur, réessayez plus tard.");
        } else {
          setError(data.message || "Erreur inconnue");
        }
        return;
      }

      const data = await response.json();
      setShortUrl(data.short_url);
    } catch (err) {
      setError("Erreur réseau, vérifie que le backend est lancé sur le port 8080");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Raccourcisseur d'URL</h1>

      <input
        type="text"
        placeholder="Collez votre URL ici"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "300px", padding: "0.5rem", marginRight: "1rem" }}
      />
      <button onClick={handleShorten} style={{ padding: "0.5rem 1rem" }}>
        Raccourcir
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      {shortUrl && (
        <p style={{ color: "green", marginTop: "1rem" }}>
          URL raccourcie : <a href={shortUrl}>{shortUrl}</a>
        </p>
      )}
    </div>
  );
}
