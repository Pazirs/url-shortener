package main

import (
	"log"
	"net/http" // ← nécessaire pour ListenAndServe
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

	// Lancement du serveur
	log.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
