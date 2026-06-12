import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AlumnosPage from './pages/AlumnosPage'
import AlumnoDetailPage from './pages/AlumnoDetailPage'
import AlumnoForm from './components/AlumnoForm'
import SesionesPage from './pages/SesionesPage'
import SesionForm from './components/SesionForm'
import PagosPage from './pages/PagosPage'
import PagoForm from './components/PagoForm'
import LandingPage from './pages/LandingPage'
import PreRegistrosPage from './pages/PreRegistrosPage'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Raíz → dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Landing pública — sin auth */}
      <Route path="/agendar" element={<LandingPage />} />

      {/* Login (sin layout, solo si no está autenticado) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Rutas protegidas con layout */}
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/alumnos" element={<AlumnosPage />} />
        <Route path="/alumnos/nuevo" element={<AlumnoForm />} />
        <Route path="/alumnos/:id" element={<AlumnoDetailPage />} />
        <Route path="/alumnos/:id/editar" element={<AlumnoForm />} />
        <Route path="/sesiones" element={<SesionesPage />} />
        <Route path="/sesiones/nueva" element={<SesionForm />} />
        <Route path="/pagos" element={<PagosPage />} />
        <Route path="/pagos/nuevo" element={<PagoForm />} />
        <Route path="/pre-registros" element={<PreRegistrosPage />} />
      </Route>

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
