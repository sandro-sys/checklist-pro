import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, 
  LayoutDashboard, 
  ClipboardList, 
  Building2, 
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  User,
  Zap,
  FileText,
  Crown,
  Headphones
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const getMenuItems = (isMaster) => {
  const items = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/checklists', icon: ClipboardList, label: 'Checklists' },
    { path: '/team', icon: Users, label: 'Equipe' },
    { path: '/company', icon: Building2, label: 'Empresa' },
    { path: '/quick-actions', icon: Zap, label: 'Acoes Rapidas' },
    { path: '/reports', icon: FileText, label: 'Relatorios' },
    { path: '/support', icon: Headphones, label: 'Suporte' },
    { path: '/pricing', icon: CreditCard, label: 'Planos' },
    { path: '/subscriptions', icon: CreditCard, label: 'Assinaturas' },
  ]
  
  if (isMaster) {
    items.push({ path: '/admin', icon: Crown, label: 'Painel Master', isMaster: true })
  }
  
  return items
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50">
        {/* Logo */}
        <div className="p-6 border-b border-dark-700/50">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-teal rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CheckList App</h1>
              <p className="text-dark-400 text-xs">Powered by SO.RH.IA</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {getMenuItems(user?.is_master).map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? item.isMaster 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                    : item.isMaster
                      ? 'text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400'
                      : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Quick Action */}
        <div className="p-4 border-t border-dark-700/50">
          <Link
            to="/checklists/create"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 btn-glow"
          >
            <Plus className="w-5 h-5" />
            Novo Checklist
          </Link>
        </div>

        {/* User */}
        <div className="p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-accent-teal/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full mt-3 px-4 py-2 text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-dark-700 z-50 flex flex-col"
            >
              {/* Close Button */}
              <div className="p-4 flex justify-end">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-dark-400 hover:text-white rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Logo */}
              <div className="px-6 pb-6 border-b border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-teal rounded-xl flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">CheckList App</h1>
                    <p className="text-dark-400 text-xs">Powered by SO.RH.IA</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {getMenuItems(user?.is_master).map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                          ? item.isMaster 
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-primary-500/10 text-primary-400' 
                          : item.isMaster
                            ? 'text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400'
                            : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Quick Action */}
              <div className="p-4">
                <Link
                  to="/checklists/create"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary-500 to-accent-teal text-white font-semibold rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                  Novo Checklist
                </Link>
              </div>

              {/* User */}
              <div className="p-4 border-t border-dark-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-dark-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-dark-400 hover:text-rose-400 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar - Mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-dark-300 hover:text-white rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-teal rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CheckList App</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 text-dark-300 hover:text-white rounded-lg"
              >
                <User className="w-6 h-6" />
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 py-2 bg-dark-800 border border-dark-700 rounded-xl shadow-xl"
                  >
                    <div className="px-4 py-2 border-b border-dark-700">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-dark-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-dark-400 hover:text-rose-400 hover:bg-dark-700/50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sair</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-dark-700/50 bg-dark-900/50 py-4 px-6">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white">
              SO.RH.IA - Sistema Operacional de RH com Inteligência Assistida
            </h3>
            <p className="text-dark-400 text-xs mt-1">
              Organize seus processos de forma simples
            </p>
            <p className="text-dark-500 text-xs mt-2">
              © 2025 SO.RH.IA. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

