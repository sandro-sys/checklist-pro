import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Subscriptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, subsRes, paymentsRes] = await Promise.all([
        api.get('/payments/admin/stats'),
        api.get('/payments/admin/subscriptions'),
        api.get('/payments/payments')
      ]);
      setStats(statsRes.data);
      setSubscriptions(subsRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados de assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      cancelled: 'bg-red-500/20 text-red-400',
      expired: 'bg-gray-500/20 text-gray-400'
    };
    const labels = {
      active: 'Ativa',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      expired: 'Expirada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const styles = {
      trial: 'bg-blue-500/20 text-blue-400',
      basic: 'bg-amber-500/20 text-amber-400',
      pro: 'bg-purple-500/20 text-purple-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[plan] || styles.trial}`}>
        {plan?.charAt(0).toUpperCase() + plan?.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 text-amber-500 hover:text-amber-400"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinaturas</h1>
          <p className="text-gray-400">Gerencie assinaturas e pagamentos</p>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Ver Planos
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Assinaturas Ativas</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.active_subscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Trials Ativos</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.trial_subscriptions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Receita do Mes</p>
                <p className="text-3xl font-bold text-amber-500 mt-1">{formatCurrency(stats.monthly_revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Receita Total</p>
                <p className="text-3xl font-bold text-green-500 mt-1">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Visao Geral
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subscriptions'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Todas Assinaturas
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'payments'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Historico de Pagamentos
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ultimas assinaturas */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ultimas Assinaturas</h3>
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{sub.company_name || 'Empresa'}</p>
                    <p className="text-gray-400 text-sm">{sub.owner_email}</p>
                  </div>
                  <div className="text-right">
                    {getPlanBadge(sub.plan)}
                    <p className="text-gray-400 text-xs mt-1">{formatDate(sub.created_at)}</p>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <p className="text-gray-400 text-center py-4">Nenhuma assinatura ainda</p>
              )}
            </div>
          </div>

          {/* Ultimos pagamentos */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ultimos Pagamentos</h3>
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-gray-400 text-sm">{payment.payment_method}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(payment.status === 'approved' ? 'active' : payment.status)}
                    <p className="text-gray-400 text-xs mt-1">{formatDate(payment.paid_at)}</p>
                  </div>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-gray-400 text-center py-4">Nenhum pagamento ainda</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Empresa</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Proprietario</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Plano</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Inicio</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-700/30">
                    <td className="py-4 px-6 text-white">{sub.company_name || '-'}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-white">{sub.owner_name || '-'}</p>
                        <p className="text-gray-400 text-sm">{sub.owner_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">{getPlanBadge(sub.plan)}</td>
                    <td className="py-4 px-6">{getStatusBadge(sub.status)}</td>
                    <td className="py-4 px-6 text-gray-400">{formatDate(sub.start_date)}</td>
                    <td className="py-4 px-6 text-gray-400">{formatDate(sub.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subscriptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhuma assinatura encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">ID Pagamento</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Valor</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Metodo</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-medium">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-700/30">
                    <td className="py-4 px-6 text-gray-400 font-mono text-sm">
                      {payment.mp_payment_id || payment.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6 text-white font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{payment.payment_method || '-'}</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(payment.status === 'approved' ? 'active' : payment.status)}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{formatDate(payment.paid_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">Nenhum pagamento encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

