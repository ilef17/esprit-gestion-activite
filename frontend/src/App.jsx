import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CollaborateurDashboard from './pages/collaborateur/CollaborateurDashboard.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import ResponsableDashboard from './pages/responsable/ResponsableDashboard.jsx'
import Login from './pages/auth/Login.jsx'
import Signup from './pages/auth/Signup.jsx'

function HomeRedirect() {
  const { user } = useAuth()

  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  if (user?.role === 'responsable') return <Navigate to="/responsable" replace />
  
  return <CollaborateurDashboard />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Root Route (Redirects or defaults to Collaborateur) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            }
          />

          {/* Role-Specific Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/responsable"
            element={
              <ProtectedRoute allowedRoles={['responsable']}>
                <ResponsableDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App