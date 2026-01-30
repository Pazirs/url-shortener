// src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Header from "./Header";

export default function App() {
  // On commence par false, mais on va vérifier direct avec useEffect
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); 

  // Vérifie si l'utilisateur a déjà un cookie de session qui soit valide
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("http://localhost:8080/api/me", {
          credentials: "include", // Envoie ce cookie
        });
        if (res.ok) {
          setLoggedIn(true);
        }
      } catch (err) {
        console.log("Pas de session active ou erreur serveur");
      } finally {
        setLoading(false); // On fini ici
      }
    }
    checkSession();
  }, []);

  if (loading) {
    return <div style={{textAlign: "center", marginTop: "50px"}}>Chargement...</div>;
  }

  return (
    <BrowserRouter>
      <Header loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLoginSuccess={() => setLoggedIn(true)} />
            )
          }
        />

        <Route
          path="/register"
          element={loggedIn ? <Navigate to="/dashboard" /> : <Register />}
        />

        <Route
          path="/dashboard"
          element={
            loggedIn ? <Dashboard /> : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}