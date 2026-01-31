import { useState, useEffect } from "react";
import { BACKEND_URL } from "./config";
import "./Dashboard.css"; // nouveau fichier CSS pour le dashboard

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [customAlias, setCustomAlias] = useState("");
  const [message, setMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Gestion des Modales pour l'interface utilisateur améliorée
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [editValue, setEditValue] = useState(""); // Pour l'URL de destination lors de l'édition
  const [editAlias, setEditAlias] = useState(""); // Pour l'alias lors de l'édition

  // Fonction formatage universel (UTC vers Local)
  function formatDate(dateString) {
    if (!dateString) return "";
    
    // Normalisation format pour être sûr que c'est traité en UTC
    let safeDateString = dateString;
    // Si format "YYYY-MM-DD HH:MM:SS" (sans T), on le transforme
    if (dateString.includes(" ") && !dateString.includes("T")) {
        safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
        // Si ISO sans Z, on ajoute Z
        safeDateString += "Z";
    }

    const date = new Date(safeDateString);
    // Affichage dans la locale du navigateur (automatique) avec un format plus court pour le tableau
    return date.toLocaleString(undefined, { 
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }

  // Helper pour vérifier si une date est passée pour afficher le statut "Expiré"
  function isExpired(dateString) {
    if (!dateString) return false;
    // Même logique de normalisation que formatDate
    let safeDateString = dateString;
    if (dateString.includes(" ") && !dateString.includes("T")) {
        safeDateString = dateString.replace(" ", "T") + "Z";
    } else if (!dateString.endsWith("Z")) {
        safeDateString += "Z";
    }
    const expiry = new Date(safeDateString);
    return new Date() > expiry;
  }

  // NOUVEAU : Intercepteur de clic sur le lien court
  function handleLinkClick(e, u) {
    if (isExpired(u.expires_at)) {
      e.preventDefault(); // Empêche l'ouverture du lien dans un nouvel onglet
      setModalState({ type: "expired", data: u }); // Ouvre la modale d'expiration
    }
    // Si le lien est valide, on laisse faire (ouverture normale)
  }

  async function fetchUrls() {
    setMessage("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/my-urls`, {
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

    // Conversion UTC avant envoi
    let expiresAtUTC = "";
    if (expiresAt) {
      const localDate = new Date(expiresAt);
      expiresAtUTC = localDate.toISOString();
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/shorten`, {
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
      setUrl(""); // On vide aussi l'URL après succès
      setMessage("URL raccourcie avec succès !");
      fetchUrls();
    } catch {
      setMessage("Erreur réseau, backend OFF ?");
    }
  }

  // --- ACTIONS MODALES ---

  function openEdit(u) {
    setEditValue(u.long_url);
    setEditAlias(u.short_code); // On pré-remplit avec l'alias actuel
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
    setEditAlias("");
  }

  // --- ACTIONS API (Via Modales) ---

  async function confirmEdit() {
    if (!editValue) return;

    // Si on change l'alias, on envoie custom_alias, sinon juste long_url
    const body = { long_url: editValue, custom_alias: editAlias };

    try {
      const res = await fetch(`${BACKEND_URL}/api/urls/${modalState.data.short_code}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // En cas d'erreur (ex: alias pris), on l'affiche via une alerte ou dans l'UI
        alert(data.message || "Erreur lors de la modification");
        return;
      }

      closeModal();
      fetchUrls(); // Rafraîchir la liste
    } catch {
      alert("Erreur réseau, backend OFF ?");
    }
  }

  async function confirmDelete() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/urls/${modalState.data.short_code}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Erreur inconnue lors de la suppression");
        return;
      }

      closeModal();
      fetchUrls();
    } catch {
      alert("Erreur réseau, backend OFF ?");
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
          placeholder="Collez votre URL ici"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        {/* Nouvel input pour l'alias */}
        <input
          className="input-small"
          type="text"
          placeholder="Alias (optionnel)"
          value={customAlias}
          onChange={e => setCustomAlias(e.target.value)}
          maxLength={20}
        />
        {/* Input date expiration */}
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
          <span>Short URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></span>
          <button className="btn-copy" onClick={() => navigator.clipboard?.writeText(shortUrl)}>Copier</button>
        </div>
      )}

      {message && !message.includes("succès") && <div style={{color: "var(--danger-text)", marginBottom: "1rem", textAlign: "center"}}>{message}</div>}

      <div className="table-card">
        {urls.length === 0 ? (
          <div style={{padding: "3rem", textAlign: "center", color: "var(--text-light)"}}>
            <p>Vous n’avez encore aucune URL raccourcie. Utilisez le formulaire ci-dessus pour commencer !</p>
          </div>
        ) : (
          <table className="table-responsive">
            <thead>
              <tr>
                <th>Short Code</th>
                <th>URL originale</th>
                <th>Créé le</th>
                <th>Statut</th> {/* Colonne modifiée pour statut/expiration */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {urls.map(u => {
                const shortFull = u.short_code ? `${BACKEND_URL}/${u.short_code}` : "";
                const expired = u.expires_at ? isExpired(u.expires_at) : false;
                return (
                  <tr key={u.id}>
                    <td>
                        {/* Utilisation de l'intercepteur handleLinkClick */}
                        <a href={shortFull} target="_blank" rel="noopener noreferrer" className="short-link" onClick={(e) => handleLinkClick(e, u)}>
                            {u.short_code}
                        </a>
                    </td>
                    <td>
                        <span className="original-link" title={u.long_url}>{u.long_url}</span>
                    </td>
                    <td><span className="date-text">{formatDate(u.created_at)}</span></td>
                    {/* Affichage de la date d'expiration ou 'Aucune' avec badge */}
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

      {/* --- MODALES (Remplacement des alert/prompt) --- */}
      
      {/* NOUVEAU : Modale Lien Expiré */}
      {modalState.type === "expired" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h3>Lien expiré ⏳</h3>
                <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="modal-body">
                <p>Désolé, ce lien court a atteint sa date d'expiration et n'est plus disponible.</p>
            </div>
            <div className="modal-footer">
                <button className="btn-secondary" onClick={closeModal}>Fermer</button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modale Edition avec ALIAS */}
      {modalState.type === "edit" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Modifier le lien</h3><button className="close-btn" onClick={closeModal}>&times;</button></div>
            <div className="modal-body">
              <label style={{display:"block", marginBottom:"0.5rem", fontWeight:"500", color:"var(--text-secondary)"}}>Destination (URL Longue)</label>
              <input style={{width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem"}} 
                     type="text" value={editValue} onChange={e => setEditValue(e.target.value)} />
              
              <label style={{display:"block", marginBottom:"0.5rem", fontWeight:"500", color:"var(--text-secondary)"}}>Alias (Code Court)</label>
              <input style={{width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid #ddd"}} 
                     type="text" value={editAlias} onChange={e => setEditAlias(e.target.value)} />
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
              {/* Le QR Code pointe toujours vers le ShortCode, donc vers le lien court */}
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