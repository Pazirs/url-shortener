package api

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

// Structure pour suivre les visiteurs
type visitor struct {
	count     int
	startTime time.Time
}

// Le gestionnaire de limites
type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

// Création d'une nouvelle instance (10 req / 1 minute)
var globalLimiter = &RateLimiter{
	visitors: make(map[string]*visitor),
	limit:    10,
	window:   time.Minute,
}

// Fonction de nettoyage (pour ne pas saturer la mémoire avec de vieilles IPs)
func init() {
	go func() {
		for {
			time.Sleep(time.Minute)
			globalLimiter.mu.Lock()
			for ip, v := range globalLimiter.visitors {
				if time.Since(v.startTime) > globalLimiter.window {
					delete(globalLimiter.visitors, ip)
				}
			}
			globalLimiter.mu.Unlock()
		}
	}()
}

// Middleware
func RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		if r.URL.Path == "/api/me" || strings.HasPrefix(r.URL.Path, "/api/stats/") {
			next.ServeHTTP(w, r)
			return
		}

		// Récupération de l'IP
		ip := r.Header.Get("X-Forwarded-For")
		if ip == "" {
			ip = r.RemoteAddr
		}
		// Nettoyage IP
		ip = strings.Split(ip, ":")[0]

		globalLimiter.mu.Lock()
		v, exists := globalLimiter.visitors[ip]

		if !exists || time.Since(v.startTime) > globalLimiter.window {
			// Nouvelle fenêtre ou nouveau visiteur
			globalLimiter.visitors[ip] = &visitor{
				count:     1,
				startTime: time.Now(),
			}
		} else {
			// Visiteur existant dans la fenêtre actuelle
			if v.count >= globalLimiter.limit {
				globalLimiter.mu.Unlock()
				writeJSONError(w, http.StatusTooManyRequests, "rate_limit_exceeded", "Trop de requêtes. Veuillez patienter.")
				return
			}
			v.count++
		}
		globalLimiter.mu.Unlock()

		next.ServeHTTP(w, r)
	})
}
