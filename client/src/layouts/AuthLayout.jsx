import { Outlet, Link } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-teal rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <CheckSquare className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">CheckList App</h1>
              <p className="text-dark-400 text-sm mt-1">Powered by SO.RH.IA</p>
            </div>
          </div>
          
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Organize seus <span className="gradient-text">processos</span> de forma simples
            </h2>
            <p className="text-dark-300 text-lg leading-relaxed">
              Crie checklists personalizados para sua operação, 
              acompanhe execuções em tempo real e garanta a 
              qualidade dos seus processos.
            </p>
          </div>
          
          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-md">
            {[
              { text: 'Checklists Personalizados' },
              { text: 'Acesso via QR Code' },
              { text: 'Relatórios em Tempo Real' },
              { text: 'Conformidade LGPD' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700"
              >
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-dark-200 text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-teal rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">CheckList App</h1>
              <p className="text-dark-400 text-xs">Powered by SO.RH.IA</p>
            </div>
          </div>
        </div>
        
        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 text-center text-dark-500 text-sm">
          <div className="flex items-center justify-center gap-4">
            <Link to="/privacy" className="hover:text-dark-300 transition-colors">
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-dark-300 transition-colors">
              Termos de Uso
            </Link>
          </div>
          <p className="mt-2">© 2025 SO.RH.IA. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

