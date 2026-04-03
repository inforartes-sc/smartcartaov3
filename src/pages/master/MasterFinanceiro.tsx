import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Clock, CheckCircle, AlertCircle, Plus, Search, Filter, RefreshCw, X, MoreVertical, ExternalLink, Calendar, Users, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  user_id: string;
  amount: string;
  due_date: string;
  status: 'pending' | 'paid' | 'expired';
  payment_link?: string;
  created_at: string;
  username?: string;
  display_name?: string;
}

export default function MasterFinanceiro() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    user_id: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    payment_link: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, usersRes] = await Promise.all([
        fetch('/api/admin/faturas'),
        fetch('/api/admin/users')
      ]);

      if (invRes.ok && usersRes.ok) {
        const invData = await invRes.json();
        const usersData = await usersRes.json();
        
        // Map user data to invoices
        const mappedInvoices = invData.map((inv: Invoice) => {
          const u = usersData.find((user: any) => user.id === inv.user_id);
          return {
            ...inv,
            username: u?.username || 'N/A',
            display_name: u?.display_name || 'Desconhecido'
          };
        });

        setInvoices(mappedInvoices);
        setUsers(usersData);
      }
    } catch (err) {
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/faturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      });

      if (res.ok) {
        toast.success('Fatura gerada com sucesso!');
        setShowAddModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao gerar fatura');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/faturas/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success('Status atualizado');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    totalAmount: invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + parseFloat(curr.amount.replace(',', '.')), 0).toFixed(2).replace('.', ','),
    totalPending: invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount.replace(',', '.')), 0).toFixed(2).replace('.', ',')
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gestão Financeira</h1>
          <p className="text-xs text-gray-500">Gerencie faturas, cobranças e receba pagamentos dos seus clientes</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-xs shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          Gerar Fatura Manual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-blue-600" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Pago</p>
              <p className="text-xl font-black text-gray-900">R$ {stats.totalAmount}</p>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-500" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pendente</p>
              <p className="text-xl font-black text-gray-900">R$ {stats.totalPending}</p>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Faturas Pagas</p>
              <p className="text-xl font-black text-gray-900">{stats.paid}</p>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aguardando</p>
              <p className="text-xl font-black text-gray-900">{stats.pending}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-lg">
                <Wallet className="w-4 h-4 text-blue-600" />
             </div>
             <h2 className="font-bold text-gray-900">Faturas Geradas</h2>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por cliente..."
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <select 
               className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
             >
                <option value="all">Status: Todos</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Pagos</option>
                <option value="expired">Expirados</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Sincronizando dados financeiros...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs italic">Nenhuma fatura encontrada com os filtros selecionados.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 leading-none mb-1">{inv.display_name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">@{inv.username}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-sm font-black text-blue-600">R$ {inv.amount}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">
                       {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                       <select 
                         className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight border outline-none ${
                           inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                           inv.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                           'bg-red-50 text-red-700 border-red-100'
                         }`}
                         value={inv.status}
                         onChange={(e) => handleStatusUpdate(inv.id, e.target.value)}
                       >
                          <option value="pending">Pendente</option>
                          <option value="paid">Pago</option>
                          <option value="expired">Expirado</option>
                       </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {inv.payment_link && (
                            <a 
                              href={inv.payment_link} 
                              target="_blank" 
                              className="p-2 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                              title="Ver Link de Pagamento"
                            >
                               <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            onClick={fetchData}
                            className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
                          >
                             <RefreshCw className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-2xl">
                     <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Gerar Fatura Manual</h2>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preencha os dados da cobrança</p>
                  </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-gray-400" />
               </button>
            </div>

            <form onSubmit={handleAddInvoice} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Selecionar Cliente</label>
                 <div className="relative">
                    <Users className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <select
                      required
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                      value={newInvoice.user_id}
                      onChange={(e) => setNewInvoice({ ...newInvoice, user_id: e.target.value })}
                    >
                      <option value="">Selecione um cliente...</option>
                      {users.filter(u => !u.is_admin).map(u => (
                        <option key={u.id} value={u.id}>{u.display_name} (@{u.username})</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Valor (Ex: 49,90)</label>
                   <div className="relative">
                      <DollarSign className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="0,00"
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all text-blue-600"
                        value={newInvoice.amount}
                        onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Data de Vencimento</label>
                   <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newInvoice.due_date}
                        onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Link de Pagamento (Opcional)</label>
                 <div className="relative">
                    <ExternalLink className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://checkout.sua-api.com/..."
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newInvoice.payment_link}
                      onChange={(e) => setNewInvoice({ ...newInvoice, payment_link: e.target.value })}
                    />
                 </div>
                 <p className="text-[10px] text-gray-400 italic mt-1">Este link será exibido para o cliente em seu painel.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="px-6 py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm uppercase tracking-widest"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   className="px-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all text-sm uppercase tracking-widest shadow-xl shadow-blue-100"
                 >
                   Gerar Cobrança
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
