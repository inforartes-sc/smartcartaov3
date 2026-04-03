import React, { useState, useEffect } from 'react';
import { Users, Package, Eye, Trash2, Shield, ShieldAlert, Search, ExternalLink, Settings, Phone, Image as ImageIcon, Upload, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MasterAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({
    default_logo: '',
    default_phone: ''
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
    documento: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/settings')
      ]);

      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
        if (settingsRes.ok) {
          setGlobalSettings(await settingsRes.json());
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
        setNewUserData({ username: '', password: '', display_name: '', role_title: 'Consultor(a) Yamaha', slug: '', email: '', documento: '' });
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

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Carregando painel master...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
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
          {/* Logo Section */}
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

          {/* Phone Section */}
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

      {/* Add User Section */}
      {showAddUser ? (
        <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-lg shadow-blue-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Cadastrar Novo Usuário
            </h2>
            <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600 font-medium">Cancelar</button>
          </div>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={newUserData.display_name}
                onChange={(e) => setNewUserData({ ...newUserData, display_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Rose Farias"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Usuário / Email</label>
              <input
                type="text"
                required
                value={newUserData.username}
                onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: rose.farias"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Link (Slug)</label>
              <input
                type="text"
                required
                value={newUserData.slug}
                onChange={(e) => setNewUserData({ ...newUserData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: rose-farias"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha Inicial</label>
              <input
                type="password"
                required
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
              <input
                type="email"
                required
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="exemplo@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">CPF / CNPJ</label>
              <input
                type="text"
                required
                value={newUserData.documento}
                onChange={(e) => setNewUserData({ ...newUserData, documento: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Cargo / Título</label>
              <input
                type="text"
                required
                value={newUserData.role_title}
                onChange={(e) => setNewUserData({ ...newUserData, role_title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                Criar Usuário
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Users className="w-5 h-5" />
          Novo Usuário
        </button>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Controle de Usuários
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuário, nome ou link..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
        </div>

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
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
                        {u.profile_image ? (
                          <img src={u.profile_image} className="w-full h-full object-cover" />
                        ) : (
                          u.username.substring(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-none">{u.display_name || 'Sem Nome'}</p>
                        <p className="text-xs text-gray-400 mt-1">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`/${u.slug}`} 
                      target="_blank" 
                      className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1"
                    >
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
                  <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm">
                    {u.views || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        title={u.is_admin ? "Remover Admin" : "Tornar Admin"}
                        className={`p-2 rounded-lg transition-all ${u.is_admin ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400 hover:bg-amber-50 hover:text-amber-600'}`}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum usuário encontrado para "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
