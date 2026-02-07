// src/App.jsx
import React from "react";
import { ConfigProvider } from "antd";
import { Routes, Route, Navigate } from "react-router-dom"; // Solo importamos Routes y Route
import Login from "./pages/Login";
import MainLayout from "./components/MainLayout";
import MisPermisos from "./pages/MisPermisos";
import GestionPersonal from "./pages/GestionPersonal";
import GestionUsuarios from "./pages/GestionUsuarios";
import AsistenciaPage from "./pages/AsistenciaPage";
import GestionSolicitudes from "./pages/GestionSolicitudes";

const brandColors = { primary: "#003a8c", accent: "#d32029" };

function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: brandColors.primary } }}>
      {/* AQUÍ YA NO PONEMOS <BrowserRouter> PORQUE YA ESTÁ EN main.jsx */}
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Rutas anidadas dentro del Dashboard */}
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<h2>Bienvenido al Panel de Inicio</h2>} />

          {/* COMUNES */}
          <Route path="home" element={<h2>🏠 Pantalla de Inicio</h2>} />
          <Route path="mi-perfil" element={<h2>👤 Mi Perfil</h2>} />
          <Route path="mis-timbradas" element={<AsistenciaPage />} />
          <Route path="mis-permisos" element={<MisPermisos />} />
          <Route path="mi-ficha-medica" element={<h2>❤️ Mi Ficha Médica</h2>} />

          {/* GESTIÓN (TH / ADMIN) */}
          <Route path="gestion-personal" element={<GestionPersonal />} />
          <Route path="gestion-usuarios" element={<GestionUsuarios />} />
          <Route path="gestion-areas" element={<h2>🏢 Gestión de Áreas</h2>} />
          <Route path="gestion-solicitudes" element={<GestionSolicitudes />} />
          <Route
            path="reporte-asistencia"
            element={<h2>📊 Reporte General de Asistencia</h2>}
          />

          {/* MÉDICO */}
          <Route
            path="gestion-medica"
            element={<h2>🩺 Gestión de Fichas Médicas (Doctor)</h2>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ConfigProvider>
  );
}

export default App;
