package api

import "net/http"

func SetupRoutes() {
	http.HandleFunc("/api/shorten", ShortenHandler)
	http.HandleFunc("/api/register", RegisterHandler)
	http.HandleFunc("/api/login", LoginHandler)
	http.HandleFunc("/api/my-urls", MyURLsHandler)

}
