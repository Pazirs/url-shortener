// fichier errors.go
package api

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error   string `json:"error"`   // code machine-friendly
	Message string `json:"message"` // message humain lisible
}

// helper pour renvoyer des erreurs propres
func writeJSONError(w http.ResponseWriter, status int, errCode, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	json.NewEncoder(w).Encode(ErrorResponse{
		Error:   errCode,
		Message: message,
	})
}
