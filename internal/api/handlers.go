package api

import (
	"encoding/json"
	"net/http"
)

type ShortenRequest struct {
	URL string `json:"url"`
}

type ShortenResponse struct {
	ShortURL string `json:"short_url"`
}

func ShortenHandler(w http.ResponseWriter, r *http.Request) {
	var req ShortenRequest
	json.NewDecoder(r.Body).Decode(&req)

	// Retourne un lien fictif pour l'instant
	resp := ShortenResponse{
		ShortURL: "http://localhost:8080/abc123",
	}

	json.NewEncoder(w).Encode(resp)
}
