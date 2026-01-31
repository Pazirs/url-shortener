import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BACKEND_URL } from "./config"; // Import de la config

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Header from "./Header";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérification de la session au chargement de l'app
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          credentials: "include",
        });
        if (res.ok) {
          setLoggedIn(true);
        }
      } catch (err) {
        console.log("Pas de session active ou erreur serveur");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)'}}>Chargement...</div>;
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