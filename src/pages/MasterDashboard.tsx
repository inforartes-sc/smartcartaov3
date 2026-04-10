import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, ShieldAlert, Users, Settings, Rocket, Globe, Menu, X, DollarSign, Layout } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { SYSTEM_VERSION, PAYMENT_SYSTEM_URL } from '../config';
import MasterOverview from './master/MasterOverview';
import MasterUsers from './master/MasterUsers';
import MasterSettings from './master/MasterSettings';
import MasterPlans from './master/MasterPlans';
import MasterLanding from './master/MasterLanding';
import MasterFinanceiro from './master/MasterFinanceiro';
import MasterOnboarding from './master/MasterOnboarding';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';

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
    landing_example4: '',
    landing_catalog_btn_link_auto: '',
    landing_catalog_btn_link_real: '',
    landing_features_json: ''
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-[#0f172a] text-white border-b border-slate-700 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-tight">Master</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-slate-300" />
        </button>
      </header>

      {/* Sidebar Backdrop (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-[#0f172a] text-white transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:w-64 lg:h-screen lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-blue-500/10' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-slate-700 font-heading shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <ShieldAlert className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-sm lg:text-base font-black tracking-tight uppercase leading-none mb-1">
                  Master Panel
                </h2>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0">Smart Cartão {globalSettings.system_version || SYSTEM_VERSION}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto scrollbar-hide">
            {[
              { to: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
              { to: '/admin/users', icon: Users, label: 'Usuários' },
              { to: `/admin/plans`, icon: Rocket, label: 'Planos' },
              { to: `${PAYMENT_SYSTEM_URL}/login?email=${user?.email || ''}`, icon: DollarSign, label: 'Portal Financeiro', external: true },
              { to: '/admin/landing', icon: Globe, label: 'Página Inicial' },
              { to: '/admin/onboarding', icon: Layout, label: 'Onboarding' },
              { to: '/admin/settings', icon: Settings, label: 'Configurações' },
            ].map((item: any) => (
              item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all text-slate-400 hover:bg-slate-800/50 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold text-sm">{item.label}</span>
                  </div>
                  <ExternalLink className="w-4 h-4 opacity-40" />
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive(item.to) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{item.label}</span>
                </Link>
              )
            ))}
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 lg:p-8 w-full max-w-7xl mx-auto lg:mx-0">
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
                <Route path="/financeiro" element={<MasterFinanceiro />} />
                <Route path="/landing" element={<MasterLanding />} />
                <Route path="/onboarding" element={<MasterOnboarding />} />
                <Route path="/settings" element={<MasterSettings globalSettings={globalSettings} setGlobalSettings={setGlobalSettings} handleSaveSettings={handleSaveSettings} savingSettings={savingSettings} />} />
            </Routes>
        )}
      </main>
    </div>
  );
}
