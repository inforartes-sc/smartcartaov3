import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Car, 
  Home, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Search,
  Layout,
  MessageSquare,
  Calendar,
  MoreVertical,
  Plus,
  ArrowRight,
  Loader2,
  Fingerprint,
  Briefcase,
  Lock,
  Globe,
  Image as ImageIcon,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function MasterOnboarding() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<'vehicle' | 'realestate'>('vehicle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/onboarding');
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (err) {
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/onboarding/${id}/status`, {
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/onboarding/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Solicitação removida');
        fetchData();
      }
    } catch (err) {
      toast.error('Erro ao remover solicitação');
    }
  };

  const copyOnboardingLink = (niche: 'vehicle' | 'realestate') => {
    const url = `${window.location.origin}/onboarding?n=${niche}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link (${niche === 'vehicle' ? 'Veículos' : 'Imóveis'}) copiado!`, {
      icon: '🔗',
      style: { borderRadius: '15px', background: '#333', color: '#fff' }
    });
    setShowGenerator(false);
  };

  const filteredSubmissions = submissions.filter(s => 
    s.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.client_document?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <Users className="w-8 h-8 text-white" />
            </div>
            Onboarding
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie o registro completo de novos parceiros.</p>
        </div>
        
        <button 
          onClick={() => setShowGenerator(true)}
          className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-100 uppercase text-xs tracking-widest active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Gerar Link
        </button>
      </div>

      {/* Generator Modal */}
      <AnimatePresence>
        {showGenerator && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full relative"
            >
              <button 
                onClick={() => setShowGenerator(false)}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-300" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Copy className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Vincular Nicho</h3>
                <p className="text-gray-500 mt-2 font-medium">Escolha o formulário adequado para o cliente.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setSelectedNiche('vehicle')}
                  className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                    selectedNiche === 'vehicle' 
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-400'
                  }`}
                >
                  <Car className="w-10 h-10" />
                  <span className="font-black uppercase text-[10px] tracking-widest">Revenda Veículos</span>
                </button>
                <button 
                  onClick={() => setSelectedNiche('realestate')}
                  className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all ${
                    selectedNiche === 'realestate' 
                    ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' 
                    : 'border-gray-100 hover:border-gray-200 text-gray-400'
                  }`}
                >
                  <Home className="w-10 h-10" />
                  <span className="font-black uppercase text-[10px] tracking-widest">Imobiliária</span>
                </button>
              </div>

              <button 
                onClick={() => copyOnboardingLink(selectedNiche)}
                className="w-full py-5 bg-[#0f172a] hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Copiar Link <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Recebido</p>
          <p className="text-3xl font-black text-gray-900">{submissions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Novas Registros</p>
          <p className="text-3xl font-black text-orange-500">{submissions.filter(s => s.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Contas Ativas</p>
          <p className="text-3xl font-black text-emerald-500">{submissions.filter(s => s.status === 'converted').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Hoje</p>
          <p className="text-3xl font-black text-blue-500">{submissions.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 transition-colors group-focus-within:text-blue-600" />
        <input 
          type="text" 
          placeholder="Pesquisar por nome, empresa, documento ou e-mail..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full py-6 pl-16 pr-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm focus:ring-4 focus:ring-blue-50/50 outline-none transition-all placeholder:text-gray-300 font-medium"
        />
      </div>

      {/* Submissions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <span className="font-black uppercase text-[10px] tracking-[0.3em]">Sincronizando registros...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white py-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
            <MessageSquare className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aguardando novos clientes</p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => (
            <motion.div 
              key={sub.id}
              layout
              className={`bg-white p-6 lg:p-10 rounded-[3rem] border transition-all duration-300 group hover:shadow-3xl hover:shadow-blue-500/10 ${
                sub.status === 'converted' ? 'border-emerald-100/50 grayscale-[0.8] opacity-70' : 'border-gray-100 shadow-xl shadow-gray-200/40'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-gray-50 mb-8">
                <div className="flex items-start gap-8">
                  {/* Client Logo or Niche Icon */}
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 border-2 overflow-hidden transition-all duration-500 group-hover:rotate-6 ${
                    sub.niche === 'realestate' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                  }`}>
                    {sub.client_logo_url ? (
                      <img src={sub.client_logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      sub.niche === 'realestate' ? <Home className="w-10 h-10" /> : <Car className="w-10 h-10" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">{sub.client_name}</h3>
                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-sm ${
                        sub.status === 'pending' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'
                      }`}>
                        {sub.status === 'pending' ? 'Novo Registro' : 'Ativado'}
                      </span>
                    </div>
                    
                    <p className="text-gray-500 font-bold text-lg flex items-center gap-2">
                      <Layout className="w-5 h-5 text-blue-500" />
                      {sub.business_name || 'Sem Identificação'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Fingerprint className="w-3.5 h-3.5" /> {sub.client_document || 'Sem Documento'}
                      </div>
                      <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                        <Briefcase className="w-3.5 h-3.5" /> {sub.role_title || 'Consultor'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap lg:flex-nowrap items-center justify-end gap-3 shrink-0">
                  <a 
                    href={`https://wa.me/55${sub.client_whatsapp?.replace(/\D/g, '')}`}
                    target="_blank"
                    className="flex-1 lg:flex-none py-4 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] tracking-[0.2em] uppercase rounded-2xl transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    WhatsApp <ArrowRight className="w-4 h-4" />
                  </a>

                  {sub.status === 'pending' ? (
                    <button 
                      onClick={() => handleStatusUpdate(sub.id, 'converted')}
                      className="flex-1 lg:flex-none p-4 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-all border border-emerald-200 shadow-lg shadow-emerald-50 active:scale-95"
                      title="Ativar Conta"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusUpdate(sub.id, 'pending')}
                      className="flex-1 lg:flex-none p-4 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-2xl transition-all border border-orange-200 shadow-lg shadow-orange-50 active:scale-95"
                      title="Reverter para Pendente"
                    >
                      <Clock className="w-7 h-7" />
                    </button>
                  )}

                  <button 
                    onClick={() => setDeleteConfirm({ id: sub.id, name: sub.client_name })}
                    className="flex-1 lg:flex-none p-4 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-all border border-red-100 shadow-lg shadow-red-50 active:scale-95"
                    title="Excluir"
                  >
                    <Trash2 className="w-7 h-7" />
                  </button>
                </div>
              </div>

              {/* Data Review Section (Admin Register Style) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Globe className="w-3.5 h-3.5" /> Usuário Sugerido (Slug)
                  </p>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm text-gray-700 truncate select-all">
                    {sub.suggested_username || 'n/a'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Mail className="w-3.5 h-3.5" /> E-mail Registrado
                  </p>
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-sm text-gray-700 truncate select-all">
                    {sub.client_email || 'n/a'}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Lock className="w-3.5 h-3.5" /> Senha Escolhida
                  </p>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-sm text-blue-600 truncate select-all">
                    {sub.suggested_password || '********'}
                  </div>
                </div>

                  <button 
                    onClick={() => {
                      navigate('/admin/users', { 
                        state: { 
                           onboardingData: {
                              display_name: sub.client_name,
                              username: sub.suggested_username,
                              slug: sub.suggested_username,
                              documento: sub.client_document,
                              establishment: sub.business_name,
                              email: sub.client_email,
                              role_title: sub.role_title,
                              niche: sub.niche,
                              profile_image: sub.client_logo_url,
                              password: sub.suggested_password
                           } 
                        } 
                      });
                    }}
                    className="p-4 bg-slate-900 border border-slate-700 rounded-2xl font-black text-[10px] text-white uppercase tracking-widest text-center hover:bg-blue-600 transition-colors"
                  >
                    {sub.setup_type === 'admin' ? 'Suporte Smart Cadastra' : 'Mãos à Obra (Auto)'}
                  </button>
              </div>

              {/* Extras & Notes */}
              <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Volume Estimado</p>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight">{sub.product_estimated_count || '1-5'} Unidades</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-100" />
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Data do Registro</p>
                        <p className="text-xs font-black text-gray-700 uppercase tracking-tight">{new Date(sub.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex-1 max-w-sm">
                   <div className="p-4 bg-orange-50/30 border border-orange-100 rounded-2xl">
                     <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                       <MessageSquare className="w-3 h-3" /> Notas do Cliente
                     </p>
                     <p className="text-[10px] font-bold text-gray-600 leading-relaxed line-clamp-2">
                       {sub.additional_notes || 'Nenhuma observação enviada.'}
                     </p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 text-center mb-2 tracking-tight uppercase">Excluir Solicitação?</h3>
              <p className="text-sm text-gray-500 text-center mb-8 font-medium">
                Deseja remover permanentemente o registro de <span className="font-bold text-gray-900">{deleteConfirm.name}</span>?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDelete(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="px-6 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-red-100"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
