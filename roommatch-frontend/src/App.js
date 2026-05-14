import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import BuscarPisos from './pages/BuscarPisos/BuscarPisos';
import DetallePiso from './pages/DetallePiso/DetallePiso';
import MisPisos from './pages/MisPisos/MisPisos';
import PublicarPiso from './pages/PublicarPiso/PublicarPiso';
import EditarPiso from './pages/EditarPiso/EditarPiso';
import Perfil from './pages/Perfil/Perfil';
import Mensajes from './pages/Mensajes/Mensajes';
import PerfilPublico from './pages/PerfilPublico/PerfilPublico';
import MisFavoritos from './pages/MisFavoritos/MisFavoritos';
import TodasHabitaciones from './pages/TodasHabitaciones/TodasHabitaciones';
import MisPreferencias from './pages/MisPreferencias/MisPreferencias';

// Rutas donde se oculta navbar y footer
const RUTAS_SIN_NAV_EXACT = ['/', '/login', '/registro', '/mensajes', '/perfil', '/habitaciones', '/mis-preferencias'];
const RUTAS_SIN_NAV_PREFIX = ['/editar-piso', '/publicar-piso', '/usuario', '/pisos'];

function Layout() {
  const { pathname } = useLocation();
  const sinNav =
    RUTAS_SIN_NAV_EXACT.includes(pathname) ||
    RUTAS_SIN_NAV_PREFIX.some(prefix => pathname.startsWith(prefix));

  return (
    <div className="App">
      {!sinNav && <Navbar />}

      <Routes>
        {/* Públicas */}
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/registro"    element={<Register />} />
        <Route path="/buscar-pisos" element={<BuscarPisos />} />
        <Route path="/habitaciones" element={<TodasHabitaciones />} />
        <Route path="/pisos/:id"   element={<DetallePiso />} />

        {/* Privadas — cualquier usuario logueado */}
        <Route path="/mis-favoritos" element={
          <ProtectedRoute rolRequerido="inquilino"><MisFavoritos /></ProtectedRoute>
        } />
        <Route path="/mis-preferencias" element={
          <ProtectedRoute rolRequerido="inquilino"><MisPreferencias /></ProtectedRoute>
        } />
        <Route path="/mensajes" element={
          <ProtectedRoute><Mensajes /></ProtectedRoute>
        } />
        <Route path="/usuario/:id" element={
          <ProtectedRoute><PerfilPublico /></ProtectedRoute>
        } />
        <Route path="/perfil" element={
          <ProtectedRoute><Perfil /></ProtectedRoute>
        } />

        {/* Solo propietarios */}
        <Route path="/mis-pisos" element={
          <ProtectedRoute rolRequerido="propietario"><MisPisos /></ProtectedRoute>
        } />
        <Route path="/publicar-piso" element={
          <ProtectedRoute rolRequerido="propietario"><PublicarPiso /></ProtectedRoute>
        } />
        <Route path="/editar-piso/:id" element={
          <ProtectedRoute rolRequerido="propietario"><EditarPiso /></ProtectedRoute>
        } />
      </Routes>

      {!sinNav && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
