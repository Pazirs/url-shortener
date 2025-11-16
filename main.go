package main

import (
	"fmt"
	"log"
	"net/http"
	"url-shortener/internal/api"
	"url-shortener/internal/db"
)

func main() {

	fmt.Println("Server is running on http://localhost:8080")

	// Connexion à la bases de données
	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	// Setup des routes API
	api.SetupRoutes()

	// Exemple de redirection temporaire (test)
	http.HandleFunc("/abc123", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "https://google.com", http.StatusFound)
	})

	// Route principale
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("URL Shortener API"))
	})

	// Lancement du serveur
	log.Fatal(http.ListenAndServe(":8080", nil))
}
