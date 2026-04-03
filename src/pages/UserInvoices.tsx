import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, CheckCircle2, Clock, AlertCircle, ExternalLink, RefreshCw, ChevronRight, FileText, Wallet, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Invoice {
  id: number;
  amount: string;
  due_date: string;
  status: 'pending' | 'paid' | 'expired';
  payment_link?: string;
  created_at: string;
}

export default function UserInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/faturas');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      toast.error('Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'expired': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paga';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirada';
      default: return 'Inconclusiva';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Suas Faturas</h1>
          <p className="text-xs text-gray-500 font-medium">Acompanhe seus pagamentos e acesse o link de renovação</p>
        </div>
        
        <button 
          onClick={fetchInvoices}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
           <div className="p-2.5 bg-blue-50 w-fit rounded-xl mb-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total em Aberto</p>
           <p className="text-xl font-black text-gray-900">R$ {invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount.replace(',', '.')), 0).toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
           <div className="p-2.5 bg-emerald-50 w-fit rounded-xl mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Faturas Pagas</p>
           <p className="text-xl font-black text-gray-900">{invoices.filter(i => i.status === 'paid').length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
           <div className="p-2.5 bg-amber-50 w-fit rounded-xl mb-3">
              <Calendar className="w-5 h-5 text-amber-500" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status do Plano</p>
           <p className="text-xl font-black text-amber-600 uppercase tracking-tighter text-sm">
              {user?.status === 'active' ? 'Ativo' : 'Bloqueado'}
           </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
           <div className="p-2 bg-gray-50 rounded-lg">
             <FileText className="w-4 h-4 text-gray-400" />
           </div>
           <h3 className="font-bold text-gray-900">Histórico de Cobrança</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-xs text-gray-400 animate-pulse font-bold uppercase tracking-widest">Sincronizando faturas...</td>
                </tr>
              ) : invoices.filter(i => i.status === 'pending').length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center">
                     <div className="flex flex-col items-center gap-2 opacity-30">
                        <Wallet className="w-10 h-10 text-gray-400" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma fatura pendente</p>
                     </div>
                   </td>
                </tr>
              ) : (
                invoices.filter(i => i.status === 'pending').map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                       <span className="text-sm font-bold text-gray-700">{new Date(inv.due_date).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-5">
                       <span className="text-sm font-black text-blue-600">R$ {inv.amount}</span>
                    </td>
                    <td className="px-6 py-5">
                       <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tight ${getStatusColor(inv.status)}`}>
                          {getStatusIcon(inv.status)}
                          {getStatusText(inv.status)}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       {inv.status === 'pending' && inv.payment_link ? (
                         <a 
                           href={inv.payment_link} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                         >
                            Pagar Agora
                            <ExternalLink className="w-3 h-3" />
                         </a>
                       ) : (
                         <button disabled className="p-2 text-gray-300">
                            <ChevronRight className="w-5 h-5" />
                         </button>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Portal Financeiro Completo</p>
          </div>
          <a 
            href="https://pagixypay.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 underline tracking-widest flex items-center gap-1"
          >
            Acessar PagixyPay <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[32px] text-white relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-blue-600/30 transition-all duration-700"></div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
               <h3 className="text-xl font-bold mb-2">Precisa de ajuda com seu plano?</h3>
               <p className="text-slate-400 text-sm leading-relaxed">Se você tiver alguma dúvida sobre suas cobranças ou desejar alterar seu plano atual, nossa equipe de suporte está pronta para ajudar.</p>
            </div>
            <a 
              href={`https://wa.me/${user?.whatsapp?.replace(/[^0-9]/g, '')}`} 
              target="_blank"
              className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-50 transition-all whitespace-nowrap text-center"
            >
              Falar com Suporte
            </a>
         </div>
      </div>
    </div>
  );
}
