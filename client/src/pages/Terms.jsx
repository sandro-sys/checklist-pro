import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckSquare, FileText, AlertTriangle } from 'lucide-react'

export default function Terms() {
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
              <FileText className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
              <p className="text-dark-400">Última atualização: Dezembro de 2024</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6 mb-8">
              <p className="text-dark-300 leading-relaxed">
                Bem-vindo ao CheckList Pro! Ao utilizar nossa plataforma, você concorda com 
                os termos e condições descritos abaixo. Leia atentamente antes de usar nossos serviços.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {/* Section 1 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">1</span>
                  Definições
                </h2>
                <ul className="space-y-3 text-dark-300">
                  <li>
                    <strong className="text-white">Plataforma:</strong> O sistema CheckList Pro, 
                    incluindo website e aplicativos.
                  </li>
                  <li>
                    <strong className="text-white">Usuário:</strong> Pessoa física ou jurídica que 
                    utiliza a plataforma.
                  </li>
                  <li>
                    <strong className="text-white">Empresa:</strong> Organização cadastrada pelo 
                    usuário para gestão de checklists.
                  </li>
                  <li>
                    <strong className="text-white">Checklist:</strong> Lista de verificação criada 
                    e gerenciada através da plataforma.
                  </li>
                </ul>
              </section>

              {/* Section 2 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">2</span>
                  Aceitação dos Termos
                </h2>
                <p className="text-dark-300">
                  Ao criar uma conta ou utilizar a plataforma, você declara ter lido, compreendido 
                  e aceito integralmente estes Termos de Uso e nossa Política de Privacidade. 
                  Se você não concordar com algum termo, não utilize nossos serviços.
                </p>
              </section>

              {/* Section 3 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">3</span>
                  Cadastro e Conta
                </h2>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Você deve fornecer informações verdadeiras e atualizadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>É responsável por manter a confidencialidade de sua senha</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Deve notificar imediatamente sobre uso não autorizado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>É responsável por todas as atividades em sua conta</span>
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">4</span>
                  Uso da Plataforma
                </h2>
                <p className="text-dark-300 mb-4">Você concorda em:</p>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Utilizar a plataforma apenas para fins legais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Não violar direitos de terceiros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Não tentar acessar sistemas ou dados não autorizados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Não transmitir vírus ou código malicioso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-400 mt-1">•</span>
                    <span>Não utilizar bots ou automações não autorizadas</span>
                  </li>
                </ul>
              </section>

              {/* Section 5 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">5</span>
                  Propriedade Intelectual
                </h2>
                <p className="text-dark-300">
                  Todo o conteúdo da plataforma (código, design, textos, marcas) é de 
                  propriedade da CheckList Pro ou de seus licenciadores. Os checklists e 
                  dados criados pelos usuários permanecem de propriedade dos respectivos usuários.
                </p>
              </section>

              {/* Section 6 */}
              <section className="bg-gradient-to-r from-accent-amber/10 to-orange-500/10 border border-accent-amber/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-accent-amber" />
                  Limitação de Responsabilidade
                </h2>
                <p className="text-dark-300 mb-4">A CheckList Pro não se responsabiliza por:</p>
                <ul className="space-y-2 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-amber mt-1">•</span>
                    <span>Danos indiretos, incidentais ou consequenciais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-amber mt-1">•</span>
                    <span>Interrupções temporárias do serviço</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-amber mt-1">•</span>
                    <span>Perdas decorrentes de uso inadequado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-amber mt-1">•</span>
                    <span>Conteúdo criado pelos usuários</span>
                  </li>
                </ul>
              </section>

              {/* Section 7 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">7</span>
                  Cancelamento
                </h2>
                <p className="text-dark-300">
                  Você pode cancelar sua conta a qualquer momento. Reservamo-nos o direito de 
                  suspender ou encerrar contas que violem estes termos, sem aviso prévio.
                </p>
              </section>

              {/* Section 8 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">8</span>
                  Alterações nos Termos
                </h2>
                <p className="text-dark-300">
                  Podemos atualizar estes termos periodicamente. Alterações significativas 
                  serão comunicadas por email ou através da plataforma. O uso continuado 
                  após alterações constitui aceitação dos novos termos.
                </p>
              </section>

              {/* Section 9 */}
              <section className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 text-sm">9</span>
                  Legislação Aplicável
                </h2>
                <p className="text-dark-300">
                  Estes termos são regidos pelas leis da República Federativa do Brasil. 
                  Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer 
                  controvérsias decorrentes destes termos.
                </p>
              </section>

              {/* Contact */}
              <section className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Dúvidas?</h2>
                <p className="text-dark-300">
                  Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
                </p>
                <div className="mt-4 p-4 bg-dark-800/50 rounded-xl">
                  <p className="text-white font-medium">Email: contato@checklistpro.com.br</p>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

