import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  const plan = searchParams.get('plan');
  const status = searchParams.get('status');

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await api.get('/payments/subscription');
        setSubscription(response.data);
      } catch (err) {
        console.error('Erro ao verificar assinatura:', err);
        setError('Nao foi possivel verificar sua assinatura');
      } finally {
        setLoading(false);
      }
    };

    // Aguardar um pouco para o webhook processar
    setTimeout(checkSubscription, 2000);
  }, []);

  const planNames = {
    basic: 'Basic',
    pro: 'Pro',
    trial: 'Trial'
  };

  const planPrices = {
    basic: 'R$ 49,90/mes',
    pro: 'R$ 99,90/mes',
    trial: 'Gratis por 14 dias'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Processando seu pagamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-lg w-full">
        {/* Icone de sucesso animado */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Pagamento Confirmado!
        </h1>
        
        <p className="text-gray-400 text-center mb-8">
          Sua assinatura foi ativada com sucesso
        </p>

        {/* Detalhes do plano */}
        <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Plano</span>
            <span className="text-white font-semibold text-lg">
              {planNames[plan] || subscription?.plan_info?.name || 'Premium'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Valor</span>
            <span className="text-amber-500 font-semibold">
              {planPrices[plan] || `R$ ${subscription?.plan_info?.price?.toFixed(2).replace('.', ',')}/mes`}
            </span>
          </div>
          {subscription?.expires_at && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Proxima cobranca</span>
              <span className="text-white">
                {new Date(subscription.expires_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Beneficios */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-3">O que voce ganhou:</h3>
          <ul className="space-y-2">
            {plan === 'pro' ? (
              <>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Checklists ilimitados
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Colaboradores ilimitados
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Historico ilimitado
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Suporte prioritario
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ate 10 checklists
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Ate 5 colaboradores
                </li>
                <li className="flex items-center text-gray-300">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  30 dias de historico
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Acoes */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02]"
          >
            Ir para o Dashboard
          </button>
          <button
            onClick={() => navigate('/checklists/create')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Criar Primeiro Checklist
          </button>
        </div>

        {/* Nota */}
        <p className="text-gray-500 text-sm text-center mt-6">
          Voce recebera um email de confirmacao em instantes
        </p>
      </div>
    </div>
  );
}

