package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"

	"url-shortener/internal/db"
)

type ShortenRequest struct {
	URL string `json:"url"`
}

type ShortenResponse struct {
	ShortURL string `json:"short_url"`
}

// Génère un code aléatoire de n caractères
func generateShortCode(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())

	code := make([]byte, n)
	for i := range code {
		code[i] = letters[rand.Intn(len(letters))]
	}
	return string(code)
}

func ShortenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ShortenRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.URL == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	code := generateShortCode(6)

	// Sauvegarde dans SQLite
	_, err = db.DB.Exec("INSERT INTO urls (short_code, long_url) VALUES (?, ?)", code, req.URL)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	resp := ShortenResponse{
		ShortURL: fmt.Sprintf("http://localhost:8080/%s", code),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
