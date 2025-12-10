// fichier auth.go
package api

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"

	"url-shortener/internal/db"

	"golang.org/x/crypto/bcrypt"
)

// ---------- Register ----------

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	Message string `json:"message"`
}

// Handler pour créer un nouvel utilisateur
func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Méthode non autorisée")
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Email et mot de passe requis")
		return
	}

	// Hash du mot de passe
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "server_error", "Erreur serveur lors du hash du mot de passe")
		return
	}

	// Insertion dans la table users
	_, err = db.DB.Exec("INSERT INTO users (email, password_hash) VALUES (?, ?)", req.Email, string(hash))
	if err != nil {
		writeJSONError(w, http.StatusConflict, "email_taken", "Email déjà utilisé")
		return
	}

	resp := RegisterResponse{Message: "Utilisateur créé avec succès"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// ---------- Login ----------

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message string `json:"message"`
}

// Génère un token de session aléatoire
func generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Handler pour la connexion
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Méthode non autorisée")
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Requête invalide")
		return
	}

	if req.Email == "" || req.Password == "" {
		writeJSONError(w, http.StatusBadRequest, "missing_fields", "Email et mot de passe requis")
		return
	}

	// Récupère l'utilisateur depuis la BDD
	var userID int
	var passwordHash string
	err := db.DB.QueryRow("SELECT id, password_hash FROM users WHERE email = ?", req.Email).Scan(&userID, &passwordHash)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_credentials", "Email ou mot de passe incorrect")
		return
	}

	// Compare le mot de passe fourni avec le hash stocké
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_credentials", "Email ou mot de passe incorrect")
		return
	}

	// Connexion réussie — génération de la session
	sessionToken, err := generateSessionToken()
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "server_error", "Erreur serveur lors de la génération du token")
		return
	}

	// Enregistrement de la session
	_, err = db.DB.Exec("INSERT INTO sessions (user_id, session_token) VALUES (?, ?)", userID, sessionToken)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "server_error", "Erreur serveur lors de l'enregistrement de la session")
		return
	}

	// Envoi du cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		HttpOnly: true,
		Path:     "/",
	})

	resp := LoginResponse{Message: "Connexion réussie"}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
