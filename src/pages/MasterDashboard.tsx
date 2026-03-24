import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldAlert, Users, Settings, Rocket, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SYSTEM_VERSION } from '../config';
import MasterOverview from './master/MasterOverview';
import MasterUsers from './master/MasterUsers';
import MasterSettings from './master/MasterSettings';
import MasterPlans from './master/MasterPlans';
import MasterLanding from './master/MasterLanding';
import toast from 'react-hot-toast';

export default function MasterDashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState({
    default_logo: '',
    default_phone: '',
    footer_logo: '',
    favicon: '',
    footer_text: '',
    system_version: '',
    landing_hero_title: '',
    landing_hero_subtitle: '',
    landing_hero_cta: '',
    landing_stats_text: '',
    landing_concept_title: '',
    landing_concept_subtitle: '',
    landing_concept_item1_t: '',
    landing_concept_item1_d: '',
    landing_concept_item2_t: '',
    landing_concept_item2_d: '',
    landing_concept_item3_t: '',
    landing_concept_item3_d: '',
    landing_features_title: '',
    landing_cta_title: '',
    landing_cta_subtitle: '',
    landing_cta_button: '',
    landing_example1: '',
    landing_example2: '',
    landing_example3: '',
    landing_example4: ''
  });

  const [savingSettings, setSavingSettings] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const fetchData = async () => {
    try {
      setDataLoading(true);
      const [usersRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/settings')
      ]);

      if (usersRes.ok && statsRes.ok) {
        setUsers(await usersRes.json());
        setStats(await statsRes.json());
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setGlobalSettings(prev => ({ ...prev, ...s }));
        }
      } else {
        const errorData = await statsRes.json().catch(() => ({}));
        toast.error(errorData.error || 'Erro ao carregar dados do Master Admin');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.is_admin) {
      fetchData();
    }
  }, [user]);

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">CARREGANDO SISTEMA...</div>;
  if (!user || !user.is_admin) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex flex-col h-screen sticky top-0 shadow-xl z-50 transition-all">
        <div className="p-6 border-b border-slate-700 font-heading shrink-0 text-center md:text-left flex items-center justify-center md:justify-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm lg:text-base font-black tracking-tight uppercase leading-none mb-1">
              Master Panel
            </h2>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0">Smart Cartão {SYSTEM_VERSION}</p>
          </div>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 overflow-y-auto scrollbar-hide">
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/admin') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-bold text-sm">Visão Geral</span>
          </Link>
          <Link
            to="/admin/users"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/admin/users') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-bold text-sm">Usuários</span>
          </Link>
          <Link
            to="/admin/plans"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/admin/plans') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Rocket className="w-5 h-5" />
            <span className="font-bold text-sm">Planos</span>
          </Link>
          <Link
            to="/admin/landing"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/admin/landing') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="font-bold text-sm">Página Inicial</span>
          </Link>
          <Link
            to="/admin/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              isActive('/admin/settings') ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-bold text-sm">Configurações</span>
          </Link>
        </nav>

        <div className="shrink-0 p-4 border-t border-slate-700 bg-slate-900/50">
            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-2xl mb-4">
                <p className="text-[8px] uppercase font-black text-slate-500 mb-1 pl-1 tracking-widest">Sessão</p>
                <p className="font-black text-white text-xs truncate">{user.username}</p>
            </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all font-black uppercase text-[10px] tracking-widest border border-red-400/20 hover:border-transparent"
          >
            <LogOut className="w-4 h-4" />
            Sair do Master
          </button>
        </div>
        
        <div className="p-6 border-t border-slate-700 flex flex-col items-center justify-center bg-slate-900">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Tecnologia</span>
          <span className="text-xs font-black text-white tracking-tighter">SMART CARTÃO</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        {dataLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-blue-600 font-black animate-pulse uppercase tracking-[0.2em] space-y-4">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs">Sincronizando</span>
            </div>
        ) : (
            <Routes>
                <Route path="/" element={<MasterOverview stats={stats} />} />
                <Route path="/users" element={<MasterUsers users={users} fetchUsers={fetchData} />} />
                <Route path="/plans" element={<MasterPlans />} />
                <Route path="/landing" element={<MasterLanding />} />
                <Route path="/settings" element={<MasterSettings globalSettings={globalSettings} setGlobalSettings={setGlobalSettings} handleSaveSettings={handleSaveSettings} savingSettings={savingSettings} />} />
            </Routes>
        )}
      </main>
    </div>
  );
}
