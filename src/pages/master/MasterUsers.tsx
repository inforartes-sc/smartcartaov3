import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Shield, Trash2, ShieldAlert, ExternalLink, Plus, Pencil, Bell, Key, X, Send, CheckCircle, Calendar, Users, Rocket, Activity, Globe, CheckCircle2, ShieldX, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  users: any[];
  fetchUsers: () => void;
}

export default function MasterUsers({ users, fetchUsers }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; username: string } | null>(null);
  
  const [plans, setPlans] = useState<any[]>([]);

  // Edit Form States
  const [editForm, setEditForm] = useState<any>({
    display_name: '',
    role_title: '',
    slug: '',
    status: 'active',
    plan_id: '',
    plan_type: 'Standard',
    expiry_date: '',
    admin_message: '',
    establishment: '',
    is_admin: false,
    documento: '',
    email: '',
    niche: 'vehicle'
  });
  const [passForm, setPassForm] = useState('');
  const [updatingPass, setUpdatingPass] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    display_name: '',
    role_title: 'Consultor(a) Yamaha',
    slug: '',
    plan_id: '',
    expiry_date: '',
    establishment: '',
    is_admin: false,
    documento: '',
    email: '',
    niche: 'vehicle',
    profile_image: ''
  });

  // Auto-preenchimento vindo do Onboarding
  useEffect(() => {
    if (location.state?.onboardingData) {
      const data = location.state.onboardingData;
      setNewUserData(prev => ({
        ...prev,
        username: data.username || '',
        display_name: data.display_name || '',
        slug: data.slug || '',
        documento: data.documento || '',
        establishment: data.establishment || '',
        email: data.email || '',
        role_title: data.role_title || (data.niche === 'realestate' ? 'Corretor(a) de Imóveis' : 'Consultor(a) Yamaha'),
        niche: data.niche || 'vehicle',
        profile_image: data.profile_image || '',
        password: data.password || ''
      }));
      setShowAddUser(true);
      
      // Limpar o state do roteador para permitir o fechamento do formulário
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch('/api/admin/plans');
      if (res.ok) setPlans(await res.json());
    };
    fetchPlans();
  }, []);

  const calculateExpiry = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handlePlanChange = (planId: string, isEdit: boolean) => {
    const plan = plans.find(p => p.id === parseInt(planId));
    if (!plan) return;
    
    if (isEdit) {
      setEditForm({ 
        ...editForm, 
        plan_id: planId, 
        plan_type: plan.name,
        expiry_date: calculateExpiry(plan.months)
      });
    } else {
      setNewUserData({ 
        ...newUserData, 
        plan_id: planId,
        expiry_date: calculateExpiry(plan.months)
      });
    }
  };

  const getDaysRemaining = (date: string) => {
    if (!date) return null;
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

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
        setNewUserData({ username: '', password: '', display_name: '', establishment: '', role_title: 'Consultor(a) Yamaha', slug: '', plan_id: '', expiry_date: '', is_admin: false, documento: '', email: '', niche: 'vehicle', profile_image: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao criar usuário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingUser || !passForm) return;
    try {
      setUpdatingPass(true);
      const res = await fetch(`/api/admin/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passForm })
      });
      if (res.ok) {
        toast.success(`Senha de @${editingUser.username} atualizada!`);
        setPassForm('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao atualizar senha');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      setSavingUser(true);
      const res = await fetch(`/api/admin/users/${editingUser.id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        toast.success('Usuário atualizado com sucesso!');
        fetchUsers();
        setEditingUser(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao atualizar usuário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    setDeleteConfirm({ id, username });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Usuário removido com sucesso!');
        fetchUsers();
      } else {
        toast.error('Erro ao remover usuário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const toggleAdmin = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/admin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_admin: !currentStatus })
      });
      if (res.ok) {
        toast.success(currentStatus ? 'Nível master removido' : 'Nível master concedido');
        fetchUsers();
      }
    } catch (err) {
      toast.error('Erro ao atualizar nível');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Usuários</h1>
          <p className="text-xs text-gray-500">Gerenciamento de acessos</p>
        </div>
        
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {showAddUser && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
               {newUserData.profile_image ? (
                 <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-blue-50 ring-2 ring-blue-500/20">
                    <img src={newUserData.profile_image} alt="Logo Cliente" className="w-full h-full object-contain p-1" />
                 </div>
               ) : (
                 <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <ImageIcon className="w-6 h-6" />
                 </div>
               )}
               <div>
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    Cadastrar Novo Usuário
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {newUserData.profile_image ? 'Logotipo Capturado (Onboarding)' : 'Logotipo Padrão Ativo'}
                  </p>
               </div>
            </div>
            <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg transition-all active:scale-95">Fechar</button>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Nome</label>
              <input
                type="text"
                required
                value={newUserData.display_name}
                onChange={(e) => setNewUserData({ ...newUserData, display_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="Ex: Rose Farias"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Usuário</label>
              <input
                type="text"
                required
                value={newUserData.username}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="Ex: rose.farias"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Link (Slug)</label>
              <input
                type="text"
                required
                value={newUserData.slug}
                onChange={(e) => setNewUserData({ ...newUserData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="rose-farias"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">CPF / CNPJ</label>
              <input
                type="text"
                value={newUserData.documento}
                onChange={(e) => setNewUserData({ ...newUserData, documento: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="CPF ou CNPJ"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Identificação / Empresa</label>
              <input
                type="text"
                value={newUserData.establishment}
                onChange={(e) => setNewUserData({ ...newUserData, establishment: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="Ex: Yamaha Motos"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">E-mail</label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="exemplo@email.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Cargo</label>
              <input
                type="text"
                required
                value={newUserData.role_title}
                onChange={(e) => setNewUserData({ ...newUserData, role_title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Plano de Acesso</label>
              <select
                required={!newUserData.is_admin}
                value={newUserData.plan_id}
                onChange={(e) => handlePlanChange(e.target.value, false)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              >
                <option value="">Selecione um plano...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.months} meses)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Vencimento Manual</label>
              <input
                type="date"
                value={newUserData.expiry_date}
                onChange={(e) => setNewUserData({ ...newUserData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Área de Atuação (Nicho)</label>
              <select
                value={newUserData.niche}
                onChange={(e) => {
                  const newNiche = e.target.value;
                  const defaultRole = newNiche === 'realestate' ? 'Corretor(a) de Imóveis' : 'Consultor(a) Yamaha';
                  setNewUserData({ ...newUserData, niche: newNiche, role_title: defaultRole } as any);
                }}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black text-blue-600"
              >
                <option value="vehicle">Revenda de Veículos</option>
                <option value="realestate">Mercado Imobiliário</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 active:scale-95">
                Registrar e Integrar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/10">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-gray-800 tracking-tight text-sm uppercase tracking-widest">Consultores</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Consultor</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Link</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Nível</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Plano</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Acesso</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Views</th>
                <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-blue-600 font-black text-xs shrink-0 overflow-hidden">
                        {u.profile_image ? (
                          <img src={u.profile_image} className="w-full h-full object-cover" />
                        ) : (
                          u.username.substring(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{u.display_name || 'Sem Nome'}</p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <a 
                      href={`/${u.slug}`} 
                      target="_blank" 
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"
                    >
                      /{u.slug}
                    </a>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {u.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-md border border-emerald-100">
                        <CheckCircle2 className="w-2 h-2" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-md border border-rose-100">
                        <ShieldX className="w-2 h-2" />
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {u.is_admin ? (
                      <div className="flex flex-col items-center">
                         <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-md border border-amber-100 flex items-center gap-1">
                           <Shield className="w-2 h-2" />
                           Master Admin
                         </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-[8px] font-black uppercase">Consultor</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                     <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border shadow-sm ${
                      (u.plan_type || '').toLowerCase().includes('ouro') ? 'bg-yellow-400 text-yellow-900 border-yellow-500' :
                      (u.plan_type || '').toLowerCase().includes('prata') ? 'bg-slate-300 text-slate-800 border-slate-400' :
                      (u.plan_type || '').toLowerCase().includes('bronze') ? 'bg-orange-200 text-orange-900 border-orange-300' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {u.plan_type || 'Individual'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {u.expiry_date ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          getDaysRemaining(u.expiry_date)! > 5 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          <Calendar className="w-2.5 h-2.5" />
                          <span className="text-[9px] font-black uppercase tracking-tight">
                            {getDaysRemaining(u.expiry_date)! > 0 
                              ? `${getDaysRemaining(u.expiry_date)} dias` 
                              : 'Expirado'}
                          </span>
                        </div>
                        <span className="text-[7px] font-bold text-gray-300 uppercase">{new Date(u.expiry_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-200 text-[8px] font-black uppercase">Vitalício?</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-gray-600 text-xs">
                    {u.views || 0}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditForm({
                            display_name: u.display_name || '',
                            role_title: u.role_title || '',
                            slug: u.slug || '',
                            status: u.status || 'active',
                            plan_id: u.plan_id || '',
                            plan_type: u.plan_type || 'Standard',
                            expiry_date: u.expiry_date ? u.expiry_date.split('T')[0] : '',
                            admin_message: u.admin_message || '',
                            establishment: u.establishment || '',
                            is_admin: u.is_admin === true,
                            documento: u.documento || u.cpf || '',
                            email: u.email || '',
                            niche: u.niche || 'vehicle'
                          });
                        }}
                        className="p-1.5 bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                        title="Editar Usuário"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                       <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        className={`p-1.5 rounded-lg transition-all ${u.is_admin ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white'}`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 bg-gray-50 text-gray-400 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal (Improved) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Editar Consultor</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">@{editingUser.username}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 scrollbar-hide">
              {/* Profile Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-blue-500" />
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informações Básicas</label>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Nome de Exibição</label>
                      <input
                        type="text"
                        placeholder="Nome de Exibição"
                        value={editForm.display_name}
                        onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Identificação / Empresa</label>
                      <input
                        type="text"
                        placeholder="Ex: Yamaha Motos"
                        value={editForm.establishment}
                        onChange={(e) => setEditForm({ ...editForm, establishment: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Cargo / Título</label>
                      <input
                        type="text"
                        placeholder="Cargo/Título"
                        value={editForm.role_title}
                        onChange={(e) => setEditForm({ ...editForm, role_title: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">E-mail do Consultor</label>
                      <input
                        type="email"
                        placeholder="E-mail"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Link do Cartão (Slug)</label>
                      <input
                        type="text"
                        placeholder="Identificador (slug)"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">CPF / CNPJ do Consultor</label>
                      <input
                        type="text"
                        placeholder="CPF ou CNPJ"
                        value={editForm.documento}
                        onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Rocket className="w-3 h-3 text-emerald-500" />
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plano & Status</label>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Status da Conta</label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      >
                        <option value="active">Usuário Ativo</option>
                        <option value="blocked">Bloqueado / Inativo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Tipo de Plano</label>
                      <select
                        value={editForm.plan_id}
                        onChange={(e) => handlePlanChange(e.target.value, true)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      >
                        <option value="">Selecione o plano...</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.months} meses)</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Expiração do Acesso</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="date"
                          value={editForm.expiry_date}
                          onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Nível de Acesso</label>
                      <select
                        value={editForm.is_admin ? 'true' : 'false'}
                        onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.value === 'true' })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold"
                      >
                         <option value="false">Consultor (Membro)</option>
                         <option value="true">Master Admin (Total)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest pl-1">Área de Atuação (Nicho)</label>
                      <select
                        value={editForm.niche || 'vehicle'}
                        onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-blue-600"
                      >
                        <option value="vehicle">Revenda de Veículos</option>
                        <option value="realestate">Mercado Imobiliário</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-50" />

              {/* Security & Notification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-3 h-3 text-amber-500" />
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Segurança</label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Nova senha..."
                      value={passForm}
                      onChange={(e) => setPassForm(e.target.value)}
                      className="flex-grow px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                    />
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={updatingPass || !passForm}
                      className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3 h-3 text-blue-500" />
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aviso no Painel</label>
                  </div>
                  <textarea
                    placeholder="Mensagem para o topo do painel..."
                    value={editForm.admin_message}
                    onChange={(e) => setEditForm({ ...editForm, admin_message: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/30 shrink-0">
               <button 
                onClick={() => setEditingUser(null)}
                className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 transition-all text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateUser}
                disabled={savingUser}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {savingUser ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Excluir Usuário?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Tem certeza que deseja remover <span className="font-bold text-gray-900">@{deleteConfirm.username}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-3 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
