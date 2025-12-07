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

	// Setup des routes API
	api.SetupRoutes()

	// Redirection des short codes
	http.HandleFunc("/", api.RedirectHandler) // Gestion de toutes les redirections

	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
