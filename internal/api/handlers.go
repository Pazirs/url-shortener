package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"url-shortener/internal/db"

	"github.com/skip2/go-qrcode"
)

// Structures de requête et réponse
type ShortenRequest struct {
	URL         string `json:"url"`
	CustomAlias string `json:"custom_alias,omitempty"`
	ExpiresAt   string `json:"expires_at,omitempty"`
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

// vérifie si la session est valide
func GetMeHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session_token")
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "unauthenticated", "No session.")
		return
	}

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM sessions WHERE session_token = ?", cookie.Value).Scan(&userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_session", "Invalid or expired session.")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"logged_in": true,
		"user_id":   userID,
	})
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

	//  VERIFICATION DATE (UTC)
	if req.ExpiresAt != "" {

		expiryTime, err := time.Parse(time.RFC3339, req.ExpiresAt)
		if err != nil {

			writeJSONError(w, http.StatusBadRequest, "invalid_date", "Format de date invalide. Attendu : ISO 8601 UTC.")
			return
		}

		// Comparaison en UTC
		if time.Now().UTC().After(expiryTime.UTC()) {
			writeJSONError(w, http.StatusBadRequest, "date_past", "La date d'expiration doit être dans le futur.")
			return
		}
	}

	var code string
	if req.CustomAlias != "" {
		code = req.CustomAlias
		var exists int
		err = db.DB.QueryRow("SELECT 1 FROM urls WHERE short_code = ?", code).Scan(&exists)
		if err == nil {
			writeJSONError(w, http.StatusConflict, "alias_taken", "Cet alias est déjà utilisé.")
			return
		}
	} else {
		code = generateShortCode(6)
	}

	if req.ExpiresAt != "" {
		_, err = db.DB.Exec("INSERT INTO urls (short_code, long_url, user_id, expires_at) VALUES (?, ?, ?, ?)", code, req.URL, userID, req.ExpiresAt)
	} else {
		_, err = db.DB.Exec("INSERT INTO urls (short_code, long_url, user_id) VALUES (?, ?, ?)", code, req.URL, userID)
	}

	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "database_error", "Failed to save URL to database.")
		return
	}

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
			continue
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

// RedirectHandler : redirige et enregistre un clic
func RedirectHandler(w http.ResponseWriter, r *http.Request) {
	shortCode := strings.TrimPrefix(r.URL.Path, "/")
	if shortCode == "" {
		http.NotFound(w, r)
		return
	}

	var urlID int
	var longURL string
	var expiresAt sql.NullString

	err := db.DB.QueryRow("SELECT id, long_url, expires_at FROM urls WHERE short_code = ?", shortCode).Scan(&urlID, &longURL, &expiresAt)
	if err != nil {
		http.NotFound(w, r)
		return
	}

	//  VERIFICATION EXPIRATION (UTC)
	if expiresAt.Valid && expiresAt.String != "" {
		// On parse la date stockée en DB
		expiryTime, err := time.Parse(time.RFC3339, expiresAt.String)

		// Si erreur, on essaie le format SQLite quiiù est par défaut
		if err != nil {
			// On parse
			expiryTime, err = time.Parse("2006-01-02 15:04:05", expiresAt.String)
		}

		if err == nil && time.Now().UTC().After(expiryTime.UTC()) {
			w.WriteHeader(http.StatusGone) // 410 Gone
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprintf(w, `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<title>Lien expiré</title>
					<style>
						body { font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f4f4f4; color: #333; }
						.container { background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
						h1 { color: #d93025; font-size: 24px; }
						p { font-size: 16px; color: #555; line-height: 1.5; }
						a { display: inline-block; margin-top: 20px; text-decoration: none; color: white; background-color: #1a73e8; padding: 10px 20px; border-radius: 5px; }
						a:hover { background-color: #155ab6; }
					</style>
				</head>
				<body>
					<div class="container">
						<h1>Lien expiré ⏳</h1>
						<p>Désolé, ce lien court a atteint sa date d'expiration et n'est plus disponible.</p>
						<a href="/">Retour à l'accueil</a>
					</div>
				</body>
				</html>
			`)
			return
		}
	}

	visitorIP := r.Header.Get("X-Forwarded-For")
	if visitorIP == "" {
		visitorIP = r.RemoteAddr
	}
	visitorIP = strings.Trim(visitorIP, "[]")
	visitorIP = strings.Split(visitorIP, ":")[0]

	userAgent := r.UserAgent()

	city, country := "", ""
	if !strings.HasPrefix(visitorIP, "127.") && visitorIP != "::1" {
		client := http.Client{Timeout: 2 * time.Second}
		resp, err := client.Get(fmt.Sprintf("http://ip-api.com/json/%s", visitorIP))
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

	_, _ = db.DB.Exec(
		"INSERT INTO clicks (url_id, visitor_ip, user_agent, city, country) VALUES (?, ?, ?, ?, ?)",
		urlID, visitorIP, userAgent, city, country,
	)

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

	clickRows, _ := db.DB.Query(
		"SELECT created_at, visitor_ip, city, country FROM clicks WHERE url_id = ? ORDER BY created_at DESC", urlID)
	detailClicks := []map[string]string{}
	if clickRows != nil {
		defer clickRows.Close()
		for clickRows.Next() {
			var createdAt, ip, city, country sql.NullString
			_ = clickRows.Scan(&createdAt, &ip, &city, &country)
			detailClicks = append(detailClicks, map[string]string{
				"date":    createdAt.String,
				"ip":      ip.String,
				"city":    city.String,
				"country": country.String,
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

// Handler pour générer un QR Code
func QRHandler(w http.ResponseWriter, r *http.Request) {
	shortCode := strings.TrimPrefix(r.URL.Path, "/api/qr/")
	if shortCode == "" {
		writeJSONError(w, http.StatusBadRequest, "missing_code", "Short code is required.")
		return
	}

	fullShortURL := fmt.Sprintf("http://localhost:8080/%s", shortCode)
	png, err := qrcode.Encode(fullShortURL, qrcode.Medium, 256)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "qr_error", "Failed to generate QR code.")
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Write(png)
}
