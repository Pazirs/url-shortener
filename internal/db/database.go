// fichier database.go

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

	err = DB.Ping()
	if err != nil {
		return err
	}

	// Table urls
	createURLTable := `
	CREATE TABLE IF NOT EXISTS urls (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		short_code TEXT NOT NULL UNIQUE,
		long_url TEXT NOT NULL,
		user_id INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);
	`
	_, err = DB.Exec(createURLTable)
	if err != nil {
		log.Fatal(err)
	}

	// Table users
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = DB.Exec(createUsersTable)
	if err != nil {
		log.Fatal(err)
	}

	// Table sessions
	createSessionsTable := `
	CREATE TABLE IF NOT EXISTS sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		session_token TEXT NOT NULL UNIQUE,
		expires_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);
	`
	_, err = DB.Exec(createSessionsTable)
	if err != nil {
		log.Fatal(err)
	}

	// Table clicks
	createClicksTable := `
	CREATE TABLE IF NOT EXISTS clicks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		url_id INTEGER NOT NULL,
		visitor_ip TEXT,
		user_agent TEXT,
		city TEXT,
		country TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (url_id) REFERENCES urls(id)
	);
	`
	_, err = DB.Exec(createClicksTable)
	if err != nil {
		log.Fatal(err)
	}

	return nil
}
