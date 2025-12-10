// fichier routes.go
package api

import (
	"net/http"
)

func SetupRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/shorten", ShortenHandler)
	mux.HandleFunc("/api/register", RegisterHandler)
	mux.HandleFunc("/api/login", LoginHandler)
	mux.HandleFunc("/api/my-urls", MyURLsHandler)
	mux.HandleFunc("/api/stats/", StatsHandler)

	// PUT / DELETE pour une URL spécifique
	mux.HandleFunc("/api/urls/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodDelete:
			DeleteURLHandler(w, r)
		case http.MethodPut:
			UpdateURLHandler(w, r)
		default:
			writeJSONError(w, http.StatusMethodNotAllowed, "method_not_allowed",
				"Only PUT and DELETE are allowed on this route.")
		}
	})
}
