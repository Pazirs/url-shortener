package api

import "net/http"

func SetupRoutes() {
	// Routes principales
	http.HandleFunc("/api/shorten", ShortenHandler)
	http.HandleFunc("/api/register", RegisterHandler)
	http.HandleFunc("/api/login", LoginHandler)
	http.HandleFunc("/api/my-urls", MyURLsHandler)

	// Routes pour manipuler une URL spécifique (DELETE et PUT)
	http.HandleFunc("/api/urls/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodDelete:
			DeleteURLHandler(w, r)
		case http.MethodPut:
			UpdateURLHandler(w, r)
		default:
			writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed", "Only PUT and DELETE are allowed on this route.")
		}
	})
}
