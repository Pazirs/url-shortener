// fichier main.go
package main

import (
	"log"
	"net/http"
	"url-shortener/internal/api"
	"url-shortener/internal/db"
)

func main() {
	// Connexion à la base
	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	// Création du mux (le routeur)
	mux := http.NewServeMux()

	// Setup des routes API sur ce mux
	api.SetupRoutes(mux)

	// Redirection des short codes (toutes les autres routes)
	mux.HandleFunc("/", api.RedirectHandler)

	// 1. On enveloppe le routeur avec le Rate Limiter (Sécurité)
	rateLimitedMux := api.RateLimitMiddleware(mux)

	// 2. Middleware CORS (qui enveloppe maintenant le routeur sécurisé)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Autoriser le front-end
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Répondre aux requêtes OPTIONS (pré-vol)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Passer la requête au routeur sécurisé
		rateLimitedMux.ServeHTTP(w, r)
	})

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
