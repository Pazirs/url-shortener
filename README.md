# URL Shortener (Go project)

This project is a URL shortener with a REST API.

## Current Features (Checkpoint 1)
- Project architecture
- Working HTTP server
- Endpoint /api/shorten (returns a dummy short link)
- Simple redirection route
- Initialized SQLite database

## Launch the project
write on terminal :
go run main.go

Then on internet browser :

👉 http://localhost:8080/

→ Displays: URL Shortener API

👉 http://localhost:8080/abc123

→ Redirects you to Google

👉 http://localhost:8080/api/shorten

→ Will return an empty or simple response depending on your file.