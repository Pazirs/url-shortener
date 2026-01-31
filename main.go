package main

import (
	"log"
	"net/http"
	"os"
	"url-shortener/internal/api"
	"url-shortener/internal/db"
)

func main() {
	// 1. Connexion à la base de données
	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	// 2. Création du routeur
	mux := http.NewServeMux()

	// 3. Configuration des routes
	api.SetupRoutes(mux)

	// 4. Gestionnaire de redirection global
	mux.HandleFunc("/", api.RedirectHandler)

	// 5. Rate Limiter
	rateLimitedMux := api.RateLimitMiddleware(mux)

	// 6. Configuration du Port dynamique (Standard Hébergeurs/Docker)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Valeur par défaut pour le dev local
	}

	// 7. Middleware CORS
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		rateLimitedMux.ServeHTTP(w, r)
	})

	log.Printf("Server is running on http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
