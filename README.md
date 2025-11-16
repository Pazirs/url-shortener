URL Shortener (Go project)

URL shortener with a REST API.



```go
// Project structure for the URL Shortener
url-shortener/
│
├── go.mod            // Go module definition
├── main.go           // Application entry point (starts server)
├── README.md         // Project documentation
├── urls.db           // SQLite database (auto-created)
│
├── internal/
│   ├── api/          // HTTP layer (routes + handlers)
│   │   ├── handlers.go     // Logic for handling requests (shorten URL, respond JSON)
│   │   └── routes.go       // Route registration (http HandleFunc)
│   │
│   ├── db/           // Database layer
│   │   └── database.go     // SQLite connection + table creation
│   │
│   └── shortener/    // Business logic
│       └── generator.go    // Generates random short codes
│
└── web/
    └── index.html    // Future UI (optional)
```



Current Features :

Project architecture (folders + modules)

Working HTTP server

Endpoint POST /api/shorten (returns a generated short link)

Short code generator (6-character random code)

SQLite database initialized automatically (urls.db)

URL storage table created (urls)

Example redirection route (/abc123 → Google)

Launch the project



Write in the terminal:

go run main.go


Then open your browser:

👉 http://localhost:8080/

→ Displays: URL Shortener API

👉 http://localhost:8080/abc123

→ Redirects you to Google (test route)




Test the URL shortener API in a terminal :

In another terminal, run:

curl -X POST http://localhost:8080/api/shorten ^
  -H "Content-Type: application/json" ^
  -d "{\"url\":\"https://example.com\"}"


You should receive a response like:

{
  "short_url": "http://localhost:8080/Xy9AbC"
}


This means the URL has been shortened successfully.

Database update :

Each call to /api/shorten inserts a new entry into urls.db, inside the urls table:

id	short_code	long_url	created_at
1	Xy9AbC	https://example.com
	2025-01-01 12:00:00
