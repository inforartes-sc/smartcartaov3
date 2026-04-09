import React, { useState, useEffect } from 'react';
import { Users, Package, Eye, Trash2, Shield, ShieldAlert, Search, ExternalLink, Settings, Phone, Image as ImageIcon, Upload, Loader2, Save, Plus, Edit2, CheckCircle2, X, Crown, User, Timer, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    default_logo: '',
    default_phone: '',
    semiannual_discount: 15,
    annual_discount: 30
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    display_name: '',
    role_title: 'Consultor(a) Yamaha',
    slug: '',
    email: '',
    documento: '',
    niche: 'vehicle'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, settingsRes, plansRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/plans')
      ]);

      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
        if (settingsRes.ok) {
          setGlobalSettings(await settingsRes.json());
        }
        if (plansRes.ok) {
          setPlans(await plansRes.json());
        }
      } else {
        toast.error('Erro ao carregar dados do Master Admin');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      setUpdatingPlan(true);
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan)
      });
      
      if (res.ok) {
        toast.success('Plano atualizado com sucesso!');
        setEditingPlan(null);
        fetchData();
      } else {
        toast.error('Erro ao atualizar plano');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(globalSettings)
      });
      if (res.ok) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('field', 'profile_image'); // Reusing profile_image upload logic

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setGlobalSettings({ ...globalSettings, default_logo: data.url });
        toast.success('Logo enviada com sucesso!');
      } else {
        toast.error('Erro ao enviar logo');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      if (res.ok) {
        toast.success(`Usuário ${newUserData.username} criado com sucesso!`);
        setShowAddUser(false);
        setNewUserData({ username: '', password: '', display_name: '', role_title: 'Consultor(a) Yamaha', slug: '', email: '', documento: '', niche: 'vehicle' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${username}? Esta ação é irreversível.`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`Usuário ${username} removido com sucesso.`);
        fetchData();
      } else {
        toast.error('Erro ao remover usuário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: !currentStatus })
      });
      if (res.ok) {
        toast.success('Status de administrador atualizado');
        fetchData();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center font-bold text-gray-500">Carregando painel master...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Admin</h1>
          <p className="text-gray-500">Gerenciamento global do sistema</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 border-r border-gray-100">
            <Users className="w-4 h-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Usuários</span>
              <span className="font-black text-gray-900">{stats?.userCount || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-r border-gray-100">
            <Package className="w-4 h-4 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Produtos</span>
              <span className="font-black text-gray-900">{stats?.productCount || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Views</span>
              <span className="font-black text-gray-900">{stats?.totalViews || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Settings Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-800">Configurações Gerais (Padrão para Novos Usuários)</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              Logo Padrão (Foto de Perfil)
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {globalSettings.default_logo ? (
                  <img src={globalSettings.default_logo} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-grow space-y-2">
                <input
                  type="text"
                  placeholder="URL do logotipo ou faça upload..."
                  value={globalSettings.default_logo}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, default_logo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-100 transition-all">
                  <Upload className="w-3 h-3" />
                  Fazer Upload
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-500" />
              WhatsApp Padrão
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Ex: 5592984488888"
                value={globalSettings.default_phone}
                onChange={(e) => setGlobalSettings({ ...globalSettings, default_phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400">Este número será configurado automaticamente em todos os novos usuários criados.</p>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2 pt-4 border-t border-gray-50">
            <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Incentivos de Assinatura (Exibidos na Landing Page)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Desconto Semestral (%)</label>
                  <input
                    type="number"
                    value={globalSettings.semiannual_discount}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, semiannual_discount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Desconto Anual (%)</label>
                  <input
                    type="number"
                    value={globalSettings.annual_discount}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, annual_discount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Management Section */}
      <div id="plans-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h2 className="font-bold text-gray-800">Planos e Vagas</h2>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Master Control</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 hover:border-blue-200 transition-all group relative">
              <button 
                onClick={() => setEditingPlan(plan)}
                className="absolute top-4 right-4 p-2 bg-white text-blue-600 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-blue-100">
                  {plan.name?.substring(0, 1)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-none">{plan.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">ID: {plan.id}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Preço</span>
                  <p className="text-xl font-black text-gray-900 leading-none">R$ {plan.price}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white p-2 rounded-lg border border-gray-100 text-center">
                    <p className="text-[8px] uppercase font-bold text-gray-400">Vagas</p>
                    <p className="text-xs font-black text-gray-900">{plan.quota || '---'}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-gray-100 text-center">
                    <p className="text-[8px] uppercase font-bold text-gray-400">Filiais</p>
                    <p className="text-xs font-black text-gray-900">{plan.agencies || '---'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Configurar {editingPlan.name}</h2>
                  <p className="text-xs text-gray-500">ID do Plano: {editingPlan.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingPlan(null)} className="p-3 hover:bg-white rounded-2xl transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdatePlan} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Nome do Plano</label>
                    <input
                      type="text"
                      value={editingPlan.name || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Preço Mensal (R$)</label>
                    <input
                      type="text"
                      value={editingPlan.price || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Vagas (Cotas)</label>
                    <input
                      type="text"
                      value={editingPlan.quota || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, quota: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Limite de Filiais</label>
                    <input
                      type="text"
                      value={editingPlan.agencies || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, agencies: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Ciclo de Faturamento</label>
                    <select
                      value={editingPlan.billing_cycle || 'monthly'}
                      onChange={(e) => setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-blue-600 font-bold"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="semiannual">Semestral</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                     <input
                       type="checkbox"
                       id="is_popular"
                       checked={editingPlan.is_popular || false}
                       onChange={(e) => setEditingPlan({ ...editingPlan, is_popular: e.target.checked })}
                       className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                     />
                     <label htmlFor="is_popular" className="text-sm font-bold text-gray-700 uppercase tracking-tight cursor-pointer">Recomendado</label>
                  </div>
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Descrição curta</label>
                 <textarea
                   rows={2}
                   value={editingPlan.description || ''}
                   onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none font-bold"
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Recursos (separados por vírgula)</label>
                 <textarea
                   rows={3}
                   value={editingPlan.features || ''}
                   onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value })}
                   className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none font-bold"
                 />
               </div>

               <div className="flex gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setEditingPlan(null)}
                   className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-bold hover:bg-gray-200 transition-all"
                 >
                   Cancelar
                 </button>
                 <button 
                   type="submit"
                   disabled={updatingPlan}
                   className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {updatingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                   Salvar Alterações
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table and Search */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Controle de Usuários
          </h2>
          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                />
             </div>
             <button 
               onClick={() => setShowAddUser(!showAddUser)}
               className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
             >
               {showAddUser ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
               {showAddUser ? 'Fechar' : 'Novo'}
             </button>
          </div>
        </div>

        {showAddUser && (
           <div className="p-8 bg-blue-50/30 border-b border-blue-50 animate-in slide-in-from-top duration-300">
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Nome Completo</label>
                  <input type="text" required value={newUserData.display_name} onChange={(e) => setNewUserData({...newUserData, display_name: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Usuário</label>
                  <input type="text" required value={newUserData.username} onChange={(e) => setNewUserData({...newUserData, username: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Link (Slug)</label>
                  <input type="text" required value={newUserData.slug} onChange={(e) => setNewUserData({...newUserData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Email</label>
                  <input type="email" required value={newUserData.email} onChange={(e) => setNewUserData({...newUserData, email: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Senha</label>
                  <input type="password" required value={newUserData.password} onChange={(e) => setNewUserData({...newUserData, password: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">CPF/CNPJ</label>
                  <input type="text" value={newUserData.documento} onChange={(e) => setNewUserData({...newUserData, documento: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                   <button type="submit" className="w-full mt-5 bg-emerald-600 text-white font-bold py-2 rounded-xl hover:bg-emerald-700 transition-all shadow-md">Criar Conta</button>
                </div>
              </form>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Link (Slug)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Views</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                        {u.profile_image ? (
                          <img src={u.profile_image} className="w-full h-full object-cover" />
                        ) : (
                          u.username?.substring(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-none">{u.display_name || 'Sem Nome'}</p>
                        <p className="text-xs text-gray-400 mt-1">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`/${u.slug}`} target="_blank" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
                      /{u.slug}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-full">
                        <ShieldAlert className="w-3 h-3" /> Master
                      </span>
                    ) : (
                      <span className="text-gray-300 text-[10px] font-bold uppercase tracking-tighter">Membro</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm">{u.views || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => toggleAdmin(u.id, u.is_admin)} className={`p-2 rounded-lg transition-all ${u.is_admin ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-amber-50'}`}><Shield className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteUser(u.id, u.username)} className="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
