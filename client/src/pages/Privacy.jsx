import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckSquare, Shield, Lock, Eye, Trash2, Mail } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-teal rounded-xl flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">CheckList Pro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
              <p className="text-dark-400">Última atualização: Dezembro de 2024</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 mb-8">
              <p className="text-dark-300 leading-relaxed">
                A CheckList Pro está comprometida em proteger a privacidade e os dados pessoais 
                de nossos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD) - 
                Lei nº 13.709/2018.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">1</span>
                  Dados Coletados
                </h2>
                <p className="text-dark-300 mb-4">Coletamos os seguintes dados pessoais:</p>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span><strong className="text-white">Dados de identificação:</strong> nome, email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span><strong className="text-white">Dados da empresa:</strong> nome, CNPJ, endereço, telefone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span><strong className="text-white">Dados de uso:</strong> registros de execução de checklists, data e hora</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span><strong className="text-white">Dados técnicos:</strong> endereço IP, tipo de navegador (para segurança)</span>
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">2</span>
                  Finalidade do Tratamento
                </h2>
                <p className="text-dark-300 mb-4">Utilizamos seus dados para:</p>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Fornecer e manter nossos serviços de gestão de checklists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Autenticar e identificar usuários</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Gerar relatórios e estatísticas de uso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Garantir a segurança da plataforma</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Cumprir obrigações legais</span>
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">3</span>
                  Base Legal
                </h2>
                <p className="text-dark-300">
                  O tratamento de dados é realizado com base no seu <strong className="text-white">consentimento</strong> (Art. 7º, I da LGPD), 
                  fornecido no momento do cadastro, e para <strong className="text-white">execução de contrato</strong> (Art. 7º, V da LGPD) 
                  de prestação de serviços.
                </p>
              </section>

              {/* Section 4 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary-400" />
                  Segurança dos Dados
                </h2>
                <p className="text-dark-300 mb-4">Implementamos medidas de segurança técnicas e organizacionais:</p>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Criptografia de senhas com algoritmos seguros (bcrypt)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Autenticação via tokens JWT com expiração</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Proteção contra ataques (rate limiting, CORS, Helmet)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Logs de auditoria para rastreabilidade</span>
                  </li>
                </ul>
              </section>

              {/* Section 5 - Rights */}
              <section className="bg-gradient-to-r from-primary-500/10 to-accent-teal/10 border border-primary-500/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-400" />
                  Seus Direitos (LGPD)
                </h2>
                <p className="text-dark-300 mb-4">Como titular dos dados, você tem direito a:</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Confirmação da existência de tratamento',
                    'Acesso aos seus dados',
                    'Correção de dados incompletos ou desatualizados',
                    'Anonimização, bloqueio ou eliminação',
                    'Portabilidade dos dados',
                    'Eliminação dos dados tratados com consentimento',
                    'Informação sobre compartilhamento',
                    'Revogação do consentimento'
                  ].map((right, index) => (
                    <div key={index} className="flex items-center gap-2 text-dark-300">
                      <span className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 text-xs flex-shrink-0">
                        ✓
                      </span>
                      <span className="text-sm">{right}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 6 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-primary-400" />
                  Exclusão de Dados
                </h2>
                <p className="text-dark-300">
                  Você pode solicitar a exclusão de seus dados a qualquer momento através do 
                  sistema ou entrando em contato conosco. Após a solicitação, seus dados serão 
                  removidos em até <strong className="text-white">30 dias</strong>, exceto quando houver obrigação legal de retenção.
                </p>
              </section>

              {/* Contact */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-400" />
                  Contato
                </h2>
                <p className="text-dark-300">
                  Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                  entre em contato com nosso Encarregado de Proteção de Dados (DPO):
                </p>
                <div className="mt-4 p-4 bg-dark-700/50 rounded-xl">
                  <p className="text-white font-medium">Email: privacidade@checklistpro.com.br</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

