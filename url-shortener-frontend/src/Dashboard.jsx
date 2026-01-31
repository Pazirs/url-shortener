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

  function isExpired(dateString) {
    if (!dateString) return false;
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
      safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
      safeDateString += "Z";
    }
    const expiry = new Date(safeDateString);
    return new Date() > expiry;
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
      safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
      safeDateString += "Z";
    }
    const date = new Date(safeDateString);
    return date.toLocaleString(undefined, { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
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
        setUrls([]);
        return;
      }
      setUrls(Array.isArray(data) ? data : []);
    } catch {
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

    if (!url) return;

    let expiresAtUTC = "";
    if (expiresAt) {
      const localDate = new Date(expiresAt);
      expiresAtUTC = localDate.toISOString();
    }

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
      setUrl(""); 
      setMessage("Lien créé avec succès !");
      fetchUrls();
    } catch {
      setMessage("Erreur réseau");
    }
  }

  async function handleDelete(shortCode) {
    if (!window.confirm("Supprimer ce lien définitivement ?")) return;
    try {
      await fetch(`${BACKEND}/api/urls/${shortCode}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchUrls();
    } catch {
      alert("Erreur réseau");
    }
  }

  async function handleEdit(shortCode, currentLongUrl) {
    const newUrl = prompt("Nouvelle URL de destination :", currentLongUrl || "");
    if (!newUrl) return;

    try {
      await fetch(`${BACKEND}/api/urls/${shortCode}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ long_url: newUrl }),
      });
      fetchUrls();
    } catch {
      alert("Erreur réseau");
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
        alert("Erreur stats");
        return;
      }
      
      const total = data.total_clicks ?? 0;
      const uniques = data.unique_visitors ?? 0;
      alert(`📊 Statistiques\n\nTotal clics: ${total}\nVisiteurs uniques: ${uniques}`);
    } catch {
      alert("Erreur réseau");
    }
  }

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h2>Tableau de bord</h2>
        <p>Gérez vos liens et analysez vos performances.</p>
      </div>

      <form className="create-bar" onSubmit={handleShorten}>
        <input
          className="input-main"
          type="text"
          placeholder="Collez votre URL longue ici..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <input
          className="input-small"
          type="text"
          placeholder="Alias (optionnel)"
          value={customAlias}
          onChange={e => setCustomAlias(e.target.value)}
          maxLength={20}
        />
        <input
          className="input-small"
          type="datetime-local"
          value={expiresAt}
          onChange={e => setExpiresAt(e.target.value)}
        />
        <button type="submit" className="btn-create">Raccourcir ✨</button>
      </form>

      {shortUrl && (
        <div className="success-banner">
          <span>
            Lien prêt : 
            <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a>
          </span>
          <button className="btn-copy" onClick={() => navigator.clipboard?.writeText(shortUrl)}>
            Copier
          </button>
        </div>
      )}

      {message && !message.includes("succès") && (
        <div style={{color: "var(--danger-text)", marginBottom: "1rem", textAlign: "center"}}>
          {message}
        </div>
      )}

      <div className="table-card">
        {urls.length === 0 ? (
          <div style={{padding: "3rem", textAlign: "center", color: "var(--text-light)"}}>
            <p>Aucun lien pour le moment. Créez votre premier raccourci ci-dessus ! 🚀</p>
          </div>
        ) : (
          <table className="table-responsive">
            <thead>
              <tr>
                <th>Lien Court</th>
                <th>Destination</th>
                <th>Créé le</th>
                <th>Statut / Expiration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map(u => {
                const fullShort = u.short_code ? `${BACKEND}/${u.short_code}` : "";
                const expired = u.expires_at ? isExpired(u.expires_at) : false;

                return (
                  <tr key={u.id}>
                    <td>
                      <a href={fullShort} target="_blank" rel="noopener noreferrer" className="short-link">
                        {u.short_code}
                      </a>
                    </td>
                    <td>
                      <span className="original-link" title={u.long_url}>{u.long_url}</span>
                    </td>
                    <td><span className="date-text">{formatDate(u.created_at)}</span></td>
                    <td>
                      {u.expires_at ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          <span className={`status-badge ${expired ? 'expired' : 'active'}`}>
                            {expired ? 'Expiré' : 'Actif'}
                          </span>
                          <span className="date-text" style={{fontSize: '0.75rem'}}>
                            {formatDate(u.expires_at)}
                          </span>
                        </div>
                      ) : (
                        <span className="status-badge active">Toujours actif</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-group">
                        <button className="icon-btn" title="Modifier" onClick={() => handleEdit(u.short_code, u.long_url)}>✏️</button>
                        <button className="icon-btn" title="Statistiques" onClick={() => handleStats(u.short_code)}>📊</button>
                        <button className="icon-btn" title="QR Code" onClick={() => window.open(`${BACKEND}/api/qr/${u.short_code}`, "_blank")}>📱</button>
                        <button className="icon-btn delete" title="Supprimer" onClick={() => handleDelete(u.short_code)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}