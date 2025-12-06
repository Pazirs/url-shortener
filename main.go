package main

import (
	"log"
	"net/http"
	"strings"
	"url-shortener/internal/api"
	"url-shortener/internal/db"
)

func main() {
	// Connexion à la base
	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	// Setup des routes API
	api.SetupRoutes()

	// Redirection des short codes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Ignore les routes API
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Récupère le short_code depuis l'URL
		shortCode := strings.TrimPrefix(r.URL.Path, "/")
		if shortCode == "" {
			w.Write([]byte("URL Shortener API"))
			return
		}

		// Cherche l'URL longue dans la base
		var longURL string
		err := db.DB.QueryRow("SELECT long_url FROM urls WHERE short_code = ?", shortCode).Scan(&longURL)
		if err != nil {
			http.NotFound(w, r)
			return
		}

		// Redirection vers l'URL longue
		http.Redirect(w, r, longURL, http.StatusFound)
	})

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
