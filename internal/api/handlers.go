// fichier handlers.go
package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
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

type UpdateURLRequest struct {
	LongURL string `json:"long_url"`
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

	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid or expired.")
		return
	}

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

	code := generateShortCode(6)
	res, err := db.DB.Exec("INSERT INTO urls (short_code, long_url, user_id) VALUES (?, ?, ?)", code, req.URL, userID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to save URL to database.")
		return
	}

	lastID, _ := res.LastInsertId()
	fmt.Println("Insertion réussie, ID :", lastID)

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

	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid or expired.")
		return
	}

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

// Handler pour supprimer une URL
func DeleteURLHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only DELETE method is allowed.")
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid.")
		return
	}

	shortCode := strings.TrimPrefix(r.URL.Path, "/api/urls/")
	res, err := db.DB.Exec("DELETE FROM urls WHERE short_code = ? AND user_id = ?", shortCode, userID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to delete URL.")
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		writeJSONError(w, http.StatusNotFound, "not_found", "URL not found or not owned by user.")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "URL deleted successfully"})
}

// Handler pour mettre à jour une URL
func UpdateURLHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only PUT method is allowed.")
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "User must be logged in.")
		return
	}
	sessionToken := cookie.Value

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", sessionToken).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Session token is invalid.")
		return
	}

	shortCode := strings.TrimPrefix(r.URL.Path, "/api/urls/")
	var req UpdateURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.LongURL == "" {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Invalid or missing 'long_url'.")
		return
	}

	res, err := db.DB.Exec("UPDATE urls SET long_url = ? WHERE short_code = ? AND user_id = ?", req.LongURL, shortCode, userID)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to update URL.")
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		writeJSONError(w, http.StatusNotFound, "not_found", "URL not found or not owned by user.")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "URL updated successfully"})
}

// RedirectHandler : redirige et enregistre un clic (insert url_id, IP, city, country)
func RedirectHandler(w http.ResponseWriter, r *http.Request) {
	shortCode := strings.TrimPrefix(r.URL.Path, "/")
	if shortCode == "" {
		http.NotFound(w, r)
		return
	}

	// Récupérer id et long_url
	var urlID int
	var longURL string
	err := db.DB.QueryRow("SELECT id, long_url FROM urls WHERE short_code = ?", shortCode).Scan(&urlID, &longURL)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	// Récupérer l'IP du visiteur
	visitorIP := r.Header.Get("X-Forwarded-For")
	if visitorIP == "" {
		visitorIP = r.RemoteAddr
	}
	// Nettoyage pour IPv6 et ports
	visitorIP = strings.Trim(visitorIP, "[]")
	visitorIP = strings.Split(visitorIP, ":")[0]

	userAgent := r.UserAgent()

	// Initialiser city et country
	city, country := "", ""

	// Appel à ip-api seulement si IP publique
	if !strings.HasPrefix(visitorIP, "127.") && visitorIP != "::1" {
		resp, err := http.Get(fmt.Sprintf("http://ip-api.com/json/%s", visitorIP))
		if err == nil {
			defer resp.Body.Close()
			var result struct {
				City    string `json:"city"`
				Country string `json:"country"`
				Status  string `json:"status"`
			}
			_ = json.NewDecoder(resp.Body).Decode(&result)
			if result.Status == "success" {
				city = result.City
				country = result.Country
			}
		}
	}

	// Enregistrer le clic dans la base
	_, err = db.DB.Exec(
		"INSERT INTO clicks (url_id, visitor_ip, user_agent, city, country) VALUES (?, ?, ?, ?, ?)",
		urlID, visitorIP, userAgent, city, country,
	)
	if err != nil {
		fmt.Println("Erreur lors de l'enregistrement du clic :", err)
	}

	// Redirection
	http.Redirect(w, r, longURL, http.StatusFound)
}

// StatsHandler : retourne stats avec détails des clics
func StatsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only GET is allowed.")
		return
	}

	shortCode := strings.TrimPrefix(r.URL.Path, "/api/stats/")
	if shortCode == "" {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Missing short code.")
		return
	}

	var urlID int
	err := db.DB.QueryRow("SELECT id FROM urls WHERE short_code = ?", shortCode).Scan(&urlID)
	if err != nil {
		writeJSONError(w, http.StatusNotFound, "not_found", "Short code not found.")
		return
	}

	var totalClicks int
	_ = db.DB.QueryRow("SELECT COUNT(*) FROM clicks WHERE url_id = ?", urlID).Scan(&totalClicks)

	var uniqueVisitors int
	_ = db.DB.QueryRow("SELECT COUNT(DISTINCT visitor_ip) FROM clicks WHERE url_id = ?", urlID).Scan(&uniqueVisitors)

	// Clics par jour
	rows, _ := db.DB.Query(
		`SELECT strftime('%Y-%m-%d', created_at) as day, COUNT(*) 
		 FROM clicks WHERE url_id = ? GROUP BY day ORDER BY day DESC LIMIT 30`, urlID)
	clicksByDay := make(map[string]int)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var day string
			var cnt int
			_ = rows.Scan(&day, &cnt)
			clicksByDay[day] = cnt
		}
	}

	// Détails de chaque clic
	clickRows, _ := db.DB.Query(
		"SELECT created_at, visitor_ip, city, country FROM clicks WHERE url_id = ? ORDER BY created_at DESC", urlID)
	detailClicks := []map[string]string{}
	if clickRows != nil {
		defer clickRows.Close()
		for clickRows.Next() {
			var createdAt, ip, city, country string
			_ = clickRows.Scan(&createdAt, &ip, &city, &country)
			detailClicks = append(detailClicks, map[string]string{
				"date":    createdAt,
				"ip":      ip,
				"city":    city,
				"country": country,
			})
		}
	}

	resp := map[string]interface{}{
		"short_code":      shortCode,
		"total_clicks":    totalClicks,
		"unique_visitors": uniqueVisitors,
		"clicks_by_day":   clicksByDay,
		"detailed_clicks": detailClicks,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
