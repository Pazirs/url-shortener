import { useState, useEffect } from "react";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState("");

  // Récupérer les URLs de l'utilisateur
  async function fetchUrls() {
    setMessage("");
    try {
      const res = await fetch("http://localhost:8080/api/my-urls", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Impossible de récupérer les URLs");
        return;
      }

      setUrls(data);
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  useEffect(() => {
    fetchUrls();
  }, []);

  // Raccourcir une URL
  async function handleShorten(e) {
    e.preventDefault();
    setMessage("");

    if (!url) {
      setMessage("Veuillez entrer une URL");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/shorten", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue");
        return;
      }

      setShortUrl(data.short_url);
      setMessage("URL raccourcie avec succès !");
      fetchUrls(); // Mettre à jour la liste
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  // Supprimer une URL
  async function handleDelete(shortCode) {
    setMessage("");

    if (!window.confirm("Voulez-vous vraiment supprimer cette URL ?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/urls/${shortCode}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue lors de la suppression");
        return;
      }

      setMessage("URL supprimée avec succès");
      fetchUrls(); // Mettre à jour la liste
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  return (
    <div>
      <h2>Dashboard</h2>

      <form onSubmit={handleShorten}>
        <input
          type="text"
          placeholder="Collez votre URL ici"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button type="submit">Raccourcir</button>
      </form>

      {shortUrl && (
        <p>
          Short URL : <a href={shortUrl} target="_blank">{shortUrl}</a>
        </p>
      )}

      {message && <p>{message}</p>}

      <h3>Mes URLs</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Short Code</th>
            <th>URL originale</th>
            <th>Date de création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map(u => (
            <tr key={u.id}>
              <td>{u.short_code}</td>
              <td>
                <a href={u.long_url} target="_blank">{u.long_url}</a>
              </td>
              <td>{u.created_at}</td>
              <td>
                <button onClick={() => handleDelete(u.short_code)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
