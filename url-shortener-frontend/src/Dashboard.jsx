import { useState, useEffect } from "react";
import { BACKEND_URL } from "./config";
import "./Dashboard.css";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [customAlias, setCustomAlias] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Gestion des Modales
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [editValue, setEditValue] = useState(""); // Pour l'édition

  function isExpired(dateString) {
    if (!dateString) return false;
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
      safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
      safeDateString += "Z";
    }
    return new Date() > new Date(safeDateString);
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
      safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
      safeDateString += "Z";
    }
    return new Date(safeDateString).toLocaleString(undefined, { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }

  async function fetchUrls() {
    setMessage("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/my-urls`, { credentials: "include" });
      const data = await res.json().catch(() => []);
      if (res.ok) setUrls(Array.isArray(data) ? data : []);
    } catch { setUrls([]); }
  }

  useEffect(() => { fetchUrls(); }, []);

  async function handleShorten(e) {
    e.preventDefault();
    setMessage("");
    setShortUrl("");
    if (!url) return;

    let expiresAtUTC = "";
    if (expiresAt) {
      expiresAtUTC = new Date(expiresAt).toISOString();
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/shorten`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, custom_alias: customAlias, expires_at: expiresAtUTC }),
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
    } catch { setMessage("Erreur réseau"); }
  }

  // --- ACTIONS MODALES ---

  function openEdit(u) {
    setEditValue(u.long_url);
    setModalState({ type: "edit", data: u });
  }

  function openDelete(u) {
    setModalState({ type: "delete", data: u });
  }

  function openQR(u) {
    setModalState({ type: "qr", data: u });
  }

  async function openStats(u) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats/${u.short_code}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setModalState({ type: "stats", data: { ...data, short_code: u.short_code } });
      }
    } catch { alert("Erreur chargement stats"); }
  }

  function closeModal() {
    setModalState({ type: null, data: null });
    setEditValue("");
  }

  // --- ACTIONS API ---

  async function confirmEdit() {
    if (!editValue) return;
    try {
      await fetch(`${BACKEND_URL}/api/urls/${modalState.data.short_code}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ long_url: editValue }),
      });
      closeModal();
      fetchUrls();
    } catch { alert("Erreur réseau"); }
  }

  async function confirmDelete() {
    try {
      await fetch(`${BACKEND_URL}/api/urls/${modalState.data.short_code}`, {
        method: "DELETE",
        credentials: "include",
      });
      closeModal();
      fetchUrls();
    } catch { alert("Erreur réseau"); }
  }

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h2>Tableau de bord</h2>
        <p>Gérez vos liens et analysez vos performances.</p>
      </div>

      <form className="create-bar" onSubmit={handleShorten}>
        <input className="input-main" type="text" placeholder="Collez votre URL longue ici..." value={url} onChange={e => setUrl(e.target.value)} required />
        <input className="input-small" type="text" placeholder="Alias (optionnel)" value={customAlias} onChange={e => setCustomAlias(e.target.value)} maxLength={20} />
        <input className="input-small" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        <button type="submit" className="btn-create">Raccourcir ✨</button>
      </form>

      {shortUrl && (
        <div className="success-banner">
          <span>Lien prêt : <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></span>
          <button className="btn-copy" onClick={() => navigator.clipboard?.writeText(shortUrl)}>Copier</button>
        </div>
      )}

      {message && !message.includes("succès") && <div style={{color: "var(--danger-text)", marginBottom: "1rem", textAlign: "center"}}>{message}</div>}

      <div className="table-card">
        {urls.length === 0 ? (
          <div style={{padding: "3rem", textAlign: "center", color: "var(--text-light)"}}><p>Aucun lien pour le moment.</p></div>
        ) : (
          <table className="table-responsive">
            <thead>
              <tr>
                <th>Lien Court</th>
                <th>Destination</th>
                <th>Créé le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map(u => {
                const fullShort = u.short_code ? `${BACKEND_URL}/${u.short_code}` : "";
                const expired = u.expires_at ? isExpired(u.expires_at) : false;
                return (
                  <tr key={u.id}>
                    <td><a href={fullShort} target="_blank" rel="noopener noreferrer" className="short-link">{u.short_code}</a></td>
                    <td><span className="original-link" title={u.long_url}>{u.long_url}</span></td>
                    <td><span className="date-text">{formatDate(u.created_at)}</span></td>
                    <td>
                      {u.expires_at ? (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          <span className={`status-badge ${expired ? 'expired' : 'active'}`}>{expired ? 'Expiré' : 'Actif'}</span>
                          <span className="date-text" style={{fontSize: '0.75rem'}}>{formatDate(u.expires_at)}</span>
                        </div>
                      ) : <span className="status-badge active">Toujours actif</span>}
                    </td>
                    <td>
                      <div className="actions-group">
                        <button className="icon-btn" title="Modifier" onClick={() => openEdit(u)}>✏️</button>
                        <button className="icon-btn" title="Statistiques" onClick={() => openStats(u)}>📊</button>
                        <button className="icon-btn" title="QR Code" onClick={() => openQR(u)}>📱</button>
                        <button className="icon-btn delete" title="Supprimer" onClick={() => openDelete(u)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODALES --- */}
      
      {/* Modale Suppression */}
      {modalState.type === "delete" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Supprimer le lien ?</h3><button className="close-btn" onClick={closeModal}>&times;</button></div>
            <div className="modal-body"><p>Voulez-vous vraiment supprimer <strong>{modalState.data.short_code}</strong> ? Cette action est irréversible.</p></div>
            <div className="modal-footer"><button className="btn-secondary" onClick={closeModal}>Annuler</button><button className="btn-danger" onClick={confirmDelete}>Supprimer</button></div>
          </div>
        </div>
      )}

      {/* Modale Edition */}
      {modalState.type === "edit" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Modifier la destination</h3><button className="close-btn" onClick={closeModal}>&times;</button></div>
            <div className="modal-body">
              <input style={{width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd"}} 
                     type="text" value={editValue} onChange={e => setEditValue(e.target.value)} />
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={closeModal}>Annuler</button><button className="btn-save" onClick={confirmEdit}>Sauvegarder</button></div>
          </div>
        </div>
      )}

      {/* Modale QR Code */}
      {modalState.type === "qr" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>QR Code</h3><button className="close-btn" onClick={closeModal}>&times;</button></div>
            <div className="modal-body qr-image-container">
              <img src={`${BACKEND_URL}/api/qr/${modalState.data.short_code}`} alt="QR Code" style={{maxWidth: "100%", borderRadius: "8px"}} />
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={closeModal}>Fermer</button></div>
          </div>
        </div>
      )}

      {/* Modale Stats */}
      {modalState.type === "stats" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Statistiques ({modalState.data.short_code})</h3><button className="close-btn" onClick={closeModal}>&times;</button></div>
            <div className="modal-body">
              <div className="stat-grid">
                <div className="stat-box"><span className="stat-number">{modalState.data.total_clicks || 0}</span><span className="stat-label">Clics Totaux</span></div>
                <div className="stat-box"><span className="stat-number">{modalState.data.unique_visitors || 0}</span><span className="stat-label">Visiteurs Uniques</span></div>
              </div>
              <h4>Derniers clics</h4>
              <div className="stat-details">
                {modalState.data.detailed_clicks && modalState.data.detailed_clicks.length > 0 ? (
                  modalState.data.detailed_clicks.map((c, i) => (
                    <div key={i} style={{marginBottom: "0.5rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem"}}>
                      <strong>{formatDate(c.date)}</strong> - {c.city || "Ville inconnue"}, {c.country || "Pays inconnu"}
                    </div>
                  ))
                ) : <p>Aucun clic pour le moment.</p>}
              </div>
            </div>
            <div className="modal-footer"><button className="btn-secondary" onClick={closeModal}>Fermer</button></div>
          </div>
        </div>
      )}

    </div>
  );
}