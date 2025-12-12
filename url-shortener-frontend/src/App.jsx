// src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Header from "./Header";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

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
