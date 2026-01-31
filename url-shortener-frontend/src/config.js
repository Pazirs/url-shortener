// URL du backend centralisée
// Utilise la variable d'environnement VITE_BACKEND_URL si elle existe (pour la prodction),
// sinon fallback sur localhost:8080 (pour le develppement).
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";