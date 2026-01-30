# 🚀 URL Shortener (Shortify)

Un service complet de raccourcissement d'URL full-stack, développé en **Go** (Golang) et **React**.
Ce projet permet de transformer des URLs longues en liens courts, de personnaliser les alias, de générer des QR Codes et de suivre des statistiques détaillées.

---

## ✨ Fonctionnalités

### 🔗 Fonctionnalités Principales
* **Raccourcissement de lien** : Génération automatique de codes courts (ex: `/aBz12`) ou création d'**alias personnalisés** (ex: `/mon-projet`).
* **QR Codes** : Génération instantanée d'un QR Code pour chaque lien raccourci.
* **Expiration** : Possibilité de définir une date/heure d'expiration. Le lien devient invalide (Page 410 Gone) une fois la date passée.
* **Redirection intelligente** : Redirection rapide vers l'URL d'origine.

### 📊 Analytics & Dashboard
* **Tableau de bord utilisateur** : Gestion complète des liens (Liste, Modification, Suppression).
* **Statistiques** :
    * Nombre total de clics.
    * Visiteurs uniques.
    * Graphique des clics par jour (30 derniers jours).
    * Détails des clics : Date, Adresse IP, Ville et Pays (Géolocalisation).

### 🛡️ Sécurité & Technique
* **Authentification** : Inscription et Connexion sécurisées (mots de passe hashés avec bcrypt, sessions par cookie HttpOnly).
* **Rate Limiting** : Protection contre le spam (limite de requêtes par IP via Middleware).
* **Base de données** : Stockage persistant avec **SQLite**.

---

## 🛠️ Stack Technique

### Backend
* **Langage** : Go (Golang)
* **Base de données** : SQLite3
* **Authentification** : Sessions & Cookies
* **Dépendances principales** :
    * `github.com/mattn/go-sqlite3` (Driver SQL)
    * `golang.org/x/crypto` (Hashage mot de passe)
    * `github.com/skip2/go-qrcode` (Génération QR Code)

### Frontend
* **Framework** : React (v19)
* **Build Tool** : Vite
* **Routing** : React Router DOM
* **Style** : CSS Modulaire

---

## 🚀 Installation et Lancement

Prérequis : Avoir **Go** et **Node.js** installés sur votre machine.

### 1. Cloner le projet
```bash
git clone [https://github.com/Pazirs/url-shortener.git](https://github.com/Pazirs/url-shortener.git)
cd url-shortener
````
### 2. Cloner le projet
Lancer le Backend (Serveur API)
Le backend gère la logique, la base de données et sert l'API sur le port 8080.

Ouvrez un terminal à la racine du projet :

```bash

# Installe les dépendances Go
go mod tidy

# Lance le serveur
go run main.go
✅ Le serveur démarrera sur http://localhost:8080. Une base de données urls.db sera automatiquement créée à la racine.
```

### 3. Lancer le Frontend (Interface React)
Le frontend est l'interface utilisateur. Il tourne sur le port 5173 (par défaut) et communique avec le backend.

Ouvrez un deuxième terminal :

```bash

cd url-shortener-frontend

# Installe les dépendances Node
npm install

# Lance le serveur de développement
npm run dev
```bash
✅ Cliquez sur le lien affiché (ex: http://localhost:5173) pour ouvrir l'application dans votre navigateur.

📖 Guide d'utilisation
Inscription : Créez un compte via le formulaire "Créer un compte".

Connexion : Connectez-vous pour accéder à votre Dashboard.

Raccourcir :

Collez une URL longue.

(Optionnel) Choisissez un Alias personnalisé.

(Optionnel) Définissez une Date d'expiration.

Cliquez sur "Raccourcir".

Gérer :

Copiez le lien court.

Cliquez sur QR Code pour l'afficher/télécharger.

Cliquez sur Stats pour voir qui a cliqué sur votre lien.

📂 Structure du Projet
url-shortener/
├── main.go                 # Point d'entrée du Backend (Serveur, CORS, Rate Limit)
├── go.mod                  # Dépendances Go
├── urls.db                 # Base de données SQLite (générée au lancement)
│
├── internal/
│   ├── api/                # Logique API (Handlers, Routes, Middleware, Auth)
│   └── db/                 # Connexion BDD et Création des tables
│
└── url-shortener-frontend/ # Dossier du Frontend React
    ├── src/
    │   ├── App.jsx         # Composant principal (Routing)
    │   ├── Dashboard.jsx   # Tableau de bord (Logique principale UI)
    │   └── ...             # Autres composants (Login, Register, Header)
    └── package.json        # Dépendances JS
👤 Auteur
Projet réalisé dans le cadre du cours de Golang.


