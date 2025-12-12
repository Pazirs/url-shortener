import { useState, useEffect } from "react";

const BACKEND = "http://localhost:8080";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState("");

  // Récupérer les URLs de l'utilisateur
  async function fetchUrls() {
    setMessage("");
    try {
      const res = await fetch(`${BACKEND}/api/my-urls`, {
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
    setShortUrl("");

    if (!url) {
      setMessage("Veuillez entrer une URL");
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/shorten`, {
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
      fetchUrls();
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  // Supprimer une URL
  async function handleDelete(shortCode) {
    setMessage("");

    if (!window.confirm("Voulez-vous vraiment supprimer cette URL ?")) return;

    try {
      const res = await fetch(`${BACKEND}/api/urls/${shortCode}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue lors de la suppression");
        return;
      }

      setMessage("URL supprimée avec succès");
      fetchUrls();
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  // Modifier une URL
  async function handleEdit(shortCode, currentLongUrl) {
    const newUrl = prompt("Nouvelle URL :", currentLongUrl || "");
    if (!newUrl) return;

    // validation simple
    if (!/^https?:\/\//.test(newUrl)) {
      if (!window.confirm("L'URL ne commence pas par http(s). Continuer quand même ?")) {
        return;
      }
    }

    try {
      // NOTE: backend expects field "long_url"
      const res = await fetch(`${BACKEND}/api/urls/${shortCode}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ long_url: newUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur lors de la modification");
        return;
      }

      setMessage("URL modifiée avec succès !");
      fetchUrls();
    } catch (err) {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  // Afficher les stats
  async function handleStats(shortCode) {
    try {
      const res = await fetch(`${BACKEND}/api/stats/${shortCode}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erreur lors de la récupération des stats");
        return;
      }

      // backend returns total_clicks, unique_visitors, clicks_by_day
      const total = data.total_clicks ?? data.total ?? 0;
      const uniques = data.unique_visitors ?? data.unique ?? 0;
      const clicksByDay = data.clicks_by_day || {};

      // formatage simple
      let byDayText = "";
      const days = Object.keys(clicksByDay).sort();
      if (days.length === 0) byDayText = "Aucune donnée journalière.";
      else {
        byDayText = days.map(d => `${d}: ${clicksByDay[d]}`).join("\n");
      }

      alert(
        `📊 Statistiques pour ${shortCode}\n\nTotal clicks : ${total}\nVisiteurs uniques : ${uniques}\n\nClics par jour:\n${byDayText}`
      );
    } catch (err) {
      alert("Erreur réseau, backend OFF ?");
    }
  }

  // helper pour construire le short url complète
  function shortUrlFromCode(code) {
    if (!code) return "";
    // backend expected host
    return `${BACKEND}/${code}`;
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
          style={{ width: 400 }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>Raccourcir</button>
      </form>

      {shortUrl && (
        <p>
          Short URL :{" "}
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
          {" "} <button onClick={() => navigator.clipboard?.writeText(shortUrl)}>Copier</button>
        </p>
      )}

      {message && <p>{message}</p>}

      <h3>Mes URLs</h3>
      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Short URL</th>
            <th>Short Code</th>
            <th>URL originale</th>
            <th>Date de création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map(u => {
            const shortFull = shortUrlFromCode(u.short_code);
            return (
              <tr key={u.id}>
                <td>
                  <a href={shortFull} target="_blank" rel="noopener noreferrer">{shortFull}</a>
                </td>
                <td>{u.short_code}</td>
                <td>
                  <a href={u.long_url} target="_blank" rel="noopener noreferrer">{u.long_url}</a>
                </td>
                <td>{u.created_at}</td>
                <td>
                  <button onClick={() => handleEdit(u.short_code, u.long_url)}>Modifier</button>{" "}
                  <button onClick={() => handleStats(u.short_code)}>Stats</button>{" "}
                  <button onClick={() => handleDelete(u.short_code)}>Supprimer</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
