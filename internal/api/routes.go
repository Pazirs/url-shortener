package api

import "net/http"

func SetupRoutes() {
	http.HandleFunc("/api/shorten", ShortenHandler)
	http.HandleFunc("/api/register", RegisterHandler)

}
