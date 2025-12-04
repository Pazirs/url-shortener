package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"url-shortener/internal/db"
)

// Structures de requête et réponse
type ShortenRequest struct {
	URL string `json:"url"`
}

type ShortenResponse struct {
	ShortURL string `json:"short_url"`
}

type MyURLsResponse struct {
	ID        int    `json:"id"`
	ShortCode string `json:"short_code"`
	LongURL   string `json:"long_url"`
	CreatedAt string `json:"created_at"`
}

// Génération d'un code court aléatoire
func generateShortCode(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())

	code := make([]byte, n)
	for i := range code {
		code[i] = letters[rand.Intn(len(letters))]
	}
	return string(code)
}

// Handler pour raccourcir une URL
func ShortenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed.")
		return
	}

	// Vérification du cookie session_token
	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	// Récupération de l'user_id depuis la table sessions
	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid or expired.")
		return
	}
	fmt.Println("UserID récupéré depuis la session :", userID)

	// Décodage du corps JSON
	var req ShortenRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Invalid JSON body.")
		return
	}

	if req.URL == "" {
		writeJSONError(w, http.StatusBadRequest, "missing_url", "The 'url' field is required.")
		return
	}

	// Génération du code court
	code := generateShortCode(6)

	fmt.Println("Insertion URL :", code, req.URL, userID)

	res, err := db.DB.Exec("INSERT INTO urls (short_code, long_url, user_id) VALUES (?, ?, ?)", code, req.URL, userID)
	if err != nil {
		fmt.Println("Erreur SQL :", err) // <-- affichage de l'erreur complète
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to save URL to database.")
		return
	}
	lastID, _ := res.LastInsertId()
	fmt.Println("Insertion réussie, ID :", lastID)

	// Réponse JSON
	resp := ShortenResponse{
		ShortURL: fmt.Sprintf("http://localhost:8080/%s", code),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Handler pour récupérer toutes les URLs de l'utilisateur
func MyURLsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET method is allowed.")
		return
	}

	// Vérification du cookie de session
	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	// Récupération de l'user_id depuis la table sessions
	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid or expired.")
		return
	}

	// Récupération des URLs de l'utilisateur
	rows, err := db.DB.Query("SELECT id, short_code, long_url, created_at FROM urls WHERE user_id = ?", userID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to retrieve URLs.")
		return
	}
	defer rows.Close()

	var urls []MyURLsResponse
	for rows.Next() {
		var u MyURLsResponse
		err := rows.Scan(&u.ID, &u.ShortCode, &u.LongURL, &u.CreatedAt)
		if err != nil {
			writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to parse URL data.")
			return
		}
		urls = append(urls, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(urls)
}
