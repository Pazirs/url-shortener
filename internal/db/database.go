package db

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// Connect initialise la base SQLite
func Connect() error {
	var err error
	DB, err = sql.Open("sqlite3", "urls.db")
	if err != nil {
		return err
	}

	// Vérifie la connexion
	err = DB.Ping()
	if err != nil {
		return err
	}

	// Crée la table urls si elle n'existe pas
	createTable := `
	CREATE TABLE IF NOT EXISTS urls (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		short_code TEXT NOT NULL UNIQUE,
		long_url TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	_, err = DB.Exec(createTable)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}
