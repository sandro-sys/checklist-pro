import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Checklists from './pages/Checklists'
import ChecklistCreate from './pages/ChecklistCreate'
import ChecklistEdit from './pages/ChecklistEdit'
import ChecklistExecute from './pages/ChecklistExecute'
import ExecutionHistory from './pages/ExecutionHistory'
import Company from './pages/Company'
import Team from './pages/Team'
import QuickActions from './pages/QuickActions'
import Reports from './pages/Reports'
import Pricing from './pages/Pricing'
import PaymentSuccess from './pages/PaymentSuccess'
import Subscriptions from './pages/Subscriptions'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ChangePassword from './pages/ChangePassword'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirecionar para troca de senha se necessario
  if (user?.must_change_password) {
    return <Navigate to="/change-password" replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
      </Route>
      
      {/* Legal Pages */}
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      
      {/* Payment Success */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      
      {/* Change Password (requires auth but not full layout) */}
      <Route path="/change-password" element={<ChangePassword />} />
      
      {/* Public Checklist Execution */}
      <Route path="/execute/:checklistId" element={<ChecklistExecute />} />
      
      {/* Protected Routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checklists" element={<Checklists />} />
        <Route path="/checklists/create" element={<ChecklistCreate />} />
        <Route path="/checklists/:id/edit" element={<ChecklistEdit />} />
        <Route path="/checklists/:id/history" element={<ExecutionHistory />} />
        <Route path="/company" element={<Company />} />
        <Route path="/team" element={<Team />} />
        <Route path="/quick-actions" element={<QuickActions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
            <p className="text-dark-400 mb-6">Página não encontrada</p>
            <a href="/dashboard" className="text-primary-500 hover:text-primary-400">
              Voltar ao início
            </a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App

