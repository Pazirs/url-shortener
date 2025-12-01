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
		writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only POST method is allowed.")
		return
	}

	var req ShortenRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_request", "Invalid JSON body.")
		return
	}

	if req.URL == "" {
		writeJSONError(w, http.StatusBadRequest, "missing_url", "The 'url' field is required.")
		return
	}

	code := generateShortCode(6)

	_, err = db.DB.Exec("INSERT INTO urls (short_code, long_url) VALUES (?, ?)", code, req.URL)
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
