import { useState, useEffect } from "react";
import "./Dashboard.css";

const BACKEND = "http://localhost:8080";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [customAlias, setCustomAlias] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // formatage universel des dates
  // Prend une date UTC (stockée en BDD) et l'affiche en heure locale du visiteur
  function formatDate(dateString) {
    if (!dateString) return "";
    
    // Cas 1 
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
        safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
        safeDateString += "Z";
    }

    const date = new Date(safeDateString);
    return date.toLocaleString(); 
  }

  async function fetchUrls() {
    setMessage("");
    try {
      const res = await fetch(`${BACKEND}/api/my-urls`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setMessage(data.message || "Impossible de récupérer les URLs");
        setUrls([]);
        return;
      }

      setUrls(Array.isArray(data) ? data : []);
    } catch {
      setMessage("Erreur réseau, backend OFF ?");
      setUrls([]);
    }
  }

  useEffect(() => {
    fetchUrls();
  }, []);

  async function handleShorten(e) {
    e.preventDefault();
    setMessage("");
    setShortUrl("");

    if (!url) {
      setMessage("Veuillez entrer une URL");
      return;
    }

    // CONVERSION
    let expiresAtUTC = "";
    if (expiresAt) {

      const localDate = new Date(expiresAt);
      expiresAtUTC = localDate.toISOString();
    }
    // -------------------------------------------------

    try {
      const res = await fetch(`${BACKEND}/api/shorten`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          custom_alias: customAlias,
          expires_at: expiresAtUTC
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Erreur inconnue");
        return;
      }

      setShortUrl(data.short_url);
      setExpiresAt("");
      setCustomAlias("");
      setMessage("URL raccourcie avec succès !");
      fetchUrls();
    } catch {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

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
    } catch {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  async function handleEdit(shortCode, currentLongUrl) {
    const newUrl = prompt("Nouvelle URL :", currentLongUrl || "");
    if (!newUrl) return;

    if (!/^https?:\/\//.test(newUrl)) {
      if (!window.confirm("L'URL ne commence pas par http(s). Continuer quand même ?")) return;
    }

    try {
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
    } catch {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

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

      const total = data.total_clicks ?? data.total ?? 0;
      const uniques = data.unique_visitors ?? data.unique ?? 0;
      const clicksByDay = data.clicks_by_day || {};
      const detailed = data.detailed_clicks || [];

      let byDayText = "";
      const days = Object.keys(clicksByDay).sort();
      byDayText = days.length
        ? days.map(d => `${d}: ${clicksByDay[d]}`).join("\n")
        : "Aucune donnée journalière.";

      let detailedText = "";
      if (detailed.length) {
        // On formate aussi ici pour que l'historique soit à l'heure locale
        detailedText = detailed
          .map(c => `${formatDate(c.date)} - IP: ${c.ip || "N/A"}, Ville: ${c.city || "N/A"}, Pays: ${c.country || "N/A"}`)
          .join("\n");
      } else {
        detailedText = "Aucun clic enregistré.";
      }

      alert(
        `📊 Statistiques pour ${shortCode}\n\nTotal clicks : ${total}\nVisiteurs uniques : ${uniques}\n\nClics par jour:\n${byDayText}\n\nDétails des clics:\n${detailedText}`
      );
    } catch {
      alert("Erreur réseau, backend OFF ?");
    }
  }

  function shortUrlFromCode(code) {
    return code ? `${BACKEND}/${code}` : "";
  }

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>

      <form className="dashboard-form" onSubmit={handleShorten}>
        <input
          type="text"
          placeholder="Collez votre URL ici"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        {/* Nouvel input pour l'alias */}
        <input
          type="text"
          placeholder="Alias (optionnel)"
          value={customAlias}
          onChange={e => setCustomAlias(e.target.value)}
          maxLength={20}
          style={{ maxWidth: "150px", marginLeft: "10px" }} 
        />
        {/* Input date expiration */}
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
          style={{ maxWidth: "160px", marginLeft: "10px" }}
        />
        <button type="submit">Raccourcir</button>
      </form>

      {shortUrl && (
        <p className="short-url-display">
          Short URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a>
          <button onClick={() => navigator.clipboard?.writeText(shortUrl)}>Copier</button>
        </p>
      )}

      {message && <p className="message-text">{message}</p>}

      <h3>Mes URLs</h3>

      {urls.length === 0 ? (
        <p>Vous n’avez encore aucune URL raccourcie. Utilisez le formulaire ci-dessus pour commencer !</p>
      ) : (
        <table className="urls-table">
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
                  <td><a href={shortFull} target="_blank" rel="noopener noreferrer">{shortFull}</a></td>
                  <td>{u.short_code}</td>
                  <td><a href={u.long_url} target="_blank" rel="noopener noreferrer">{u.long_url}</a></td>
                  {/* Formatage automatique selon le navigateur du client */}
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <button onClick={() => handleEdit(u.short_code, u.long_url)}>Modifier</button>{" "}
                    <button onClick={() => handleStats(u.short_code)}>Stats</button>{" "}
                    <button onClick={() => window.open(`${BACKEND}/api/qr/${u.short_code}`, "_blank")}> QR Code </button>
                    <button onClick={() => handleDelete(u.short_code)}>Supprimer</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}