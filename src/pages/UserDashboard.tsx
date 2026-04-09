import React from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import { User, Package, LogOut, LayoutDashboard, ExternalLink, Palette, Copy, Share2, MousePointer2, Bell, Calendar, AlertTriangle, TrendingUp, Crown, CheckCircle, QrCode, Download, X, CreditCard, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminProfile from './AdminProfile';
import AdminProducts from './AdminProducts';
import AdminTheme from './AdminTheme';
import AdminConsultants from './AdminConsultants';
import AdminAgencies from './AdminAgencies';
import UserInvoices from './UserInvoices';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { SYSTEM_VERSION, PAYMENT_SYSTEM_URL } from '../config';
import { Menu, Users, Target, UserPlus, ShieldCheck } from 'lucide-react';

export default function UserDashboard() {
  const { user, loading, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const downloadQR = () => {
    const canvas = document.getElementById('qr-gen') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      let downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode_${user?.slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR Code baixado com sucesso!');
    }
  };

  useEffect(() => {
    if (user) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            setProductCount(data.length || 0);
            setProducts(data || []);
        })
        .catch(() => {});
      
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => setSettings(data))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const copyLink = () => {
    const url = `${window.location.origin}/${user?.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado com sucesso!');
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/${user?.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Smart Cartão',
          url: url,
        });
      } catch (err) {}
    } else {
      copyLink();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) {
    navigate('/login');
    return null;
  }

  const daysLeft = user.expiry_date ? Math.ceil((new Date(user.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isExpiring = daysLeft !== null && daysLeft <= 10;

  return (
    <div className="h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-[70] flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#003da5]">Painel</h2>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:static lg:h-screen lg:shrink-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-gray-100 font-heading shrink-0 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#003da5]">Painel de Controle</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto scrollbar-hide">
            {[
              { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/dashboard/perfil', icon: User, label: 'Meu Perfil' },
              { to: '/dashboard/produtos', icon: Package, label: 'Produtos' },
              { to: '/dashboard/consultores', icon: Users, label: 'Consultores' },
              // Only root (Matriz) accounts can manage Agencies
              ...(!user.root_id ? [{ to: '/dashboard/agencies', icon: ShieldCheck, label: 'Agências' }] : []),
              { to: `${PAYMENT_SYSTEM_URL}/login?email=${user?.email || ''}`, icon: Globe, label: 'Portal Financeiro', external: true },
              { to: '/dashboard/tema', icon: Palette, label: 'Tema' },
            ].map((item: any) => (
              item.external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-gray-700 hover:bg-blue-50/50 hover:text-blue-600"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-blue-500" />
                    {item.label}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive(item.to) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50/50 hover:text-blue-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          <div className="shrink-0">
            <div className="p-4 border-t border-gray-100">
              <a
                href={`/${user.slug}`}
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-medium mb-2"
              >
                <ExternalLink className="w-5 h-5" />
                Ver meu Cartão
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
            
            {/* Fixed Branding */}
            <div className="p-4 border-t border-gray-50 flex flex-col items-center justify-center bg-gray-50/50">
              {settings?.footer_logo ? (
                  <img src={settings.footer_logo} alt="Consultor Logo" className="h-10 w-auto object-contain mb-3 mx-auto" />
              ) : (
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 text-center">Tecnologia Smart Cartão</span>
              )}
              <span className="text-[10px] font-black text-[#003da5] tracking-widest">{settings?.system_version || SYSTEM_VERSION}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-3 lg:p-6 overflow-y-auto w-full mt-16 lg:mt-0">
        {user.admin_message && (
          <div className="mb-6 bg-blue-600 text-white p-5 rounded-[24px] shadow-lg shadow-blue-200 border border-blue-500 animate-in slide-in-from-top-4 duration-500 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
               <Bell className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Aviso do Sistema</p>
              <h3 className="font-bold text-lg leading-tight">{user.admin_message}</h3>
              {user.admin_message_date && (
                <p className="text-[10px] opacity-60 mt-1 font-medium">Enviado em: {new Date(user.admin_message_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        )}

        {isExpiring && (
          <div className="mb-6 bg-amber-500 text-white p-5 rounded-[24px] shadow-lg shadow-amber-200 border border-amber-400 animate-in slide-in-from-top-4 duration-500 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
               <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90">Renovação Necessária</p>
              </div>
              <h3 className="font-bold text-lg leading-tight">
                Seu plano expira em {daysLeft! > 0 ? `${daysLeft} dias` : 'hoje'}!
              </h3>
               <p className="text-[10px] opacity-80 mt-1 font-medium">Evite o bloqueio do seu cartão digital gerando sua fatura no portal.</p>
               <a 
                 href={`${PAYMENT_SYSTEM_URL}/login?email=${user?.email || ''}`}
                 target="_blank"
                 className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all shadow-sm"
               >
                 <CreditCard className="w-3.5 h-3.5" />
                 Acessar Portal de Pagamento
               </a>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <div className="w-full space-y-4">
              {/* Estatísticas da Equipe (Nova Seção) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl hover:border-blue-100 transition-all duration-500">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-gray-900 leading-none">{user.consultants_count || 0}</h4>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Consultores</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl hover:border-emerald-100 transition-all duration-500">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-gray-900 leading-none">
                      {Math.max(0, (user.plan?.consultants_limit || 1) - (user.consultants_count || 0))}
                    </h4>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Vagas Livres</p>
                  </div>
                </div>

                <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl hover:border-purple-100 transition-all duration-500 sm:col-span-2 lg:col-span-1">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Target className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs md:text-xs font-black text-gray-900 leading-none truncate max-w-[150px] md:max-w-[120px]">{user.plan?.name || 'Iniciante'}</h4>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Seu Plano</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas do Catálogo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                
                {/* Mais Acessados */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500 delay-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm shadow-blue-100">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Mais Acessados</h3>
                         <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">Visitas aos Produtos</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 mt-2">
                    {products.length > 0 ? (
                      [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3).map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-gray-100 shrink-0 font-black flex items-center justify-center text-gray-400 text-xs">#{i+1}</div>
                            <div className="truncate">
                              <p className="font-bold text-sm text-gray-800 truncate">{p.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.brand || 'Geral'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100/50">
                            <MousePointer2 className="w-3 h-3" />
                            <span className="font-black text-xs">{p.views || 0}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center py-8">Nenhum produto cadastrado.</p>
                    )}
                  </div>
                </div>

                {/* Mais Vendidos */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-in slide-in-from-bottom-4 duration-500 delay-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm shadow-emerald-100">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Mais Vendidos</h3>
                         <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-0.5">Top Produtos do Catálogo</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3 mt-2">
                    {products.length > 0 ? (
                      [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 3).map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 shrink-0 font-black flex items-center justify-center text-xs">#{i+1}</div>
                            <div className="truncate">
                              <p className="font-bold text-sm text-gray-800 truncate">{p.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.brand || 'Geral'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                            <CheckCircle className="w-3 h-3" />
                            <span className="font-black text-xs">{p.sales || 0}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center py-8">Nenhum produto vendido.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Card link section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4 duration-500 delay-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-orange-500"><MousePointer2 className="w-4 h-4" /></span>
                  <h3 className="font-bold text-gray-900">Seu Cartão Digital</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">Compartilhe seu link personalizado com clientes</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">URL do seu cartão</p>
                    <p className="text-blue-600 font-bold break-all text-sm">{window.location.origin}/{user.slug}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col justify-center">
                    <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">Total de Visualizações</p>
                    <p className="text-xl font-black text-blue-700">{user.views || 0}</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex flex-col justify-center">
                    <p className="text-[10px] text-orange-400 uppercase font-bold mb-1">Itens Ativos</p>
                    <p className="text-xl font-black text-orange-700">{productCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <button onClick={copyLink} className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                    <Copy className="w-4 h-4" /> Copiar Link
                  </button>
                  <button onClick={shareLink} className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                  <button onClick={() => setShowQR(true)} className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-violet-100/50 rounded-xl text-sm font-medium text-violet-700 hover:bg-violet-50 transition-all">
                    <QrCode className="w-4 h-4" /> Ver QR Code
                  </button>
                  <a href={`/${user.slug}`} target="_blank" className="flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                    <ExternalLink className="w-4 h-4" /> Visualizar
                  </a>
                </div>
              </div>

            </div>
          } />
          <Route path="/perfil" element={<AdminProfile user={user} onUpdate={setUser} />} />
          <Route path="/produtos" element={<AdminProducts />} />
          <Route path="/consultores" element={<AdminConsultants />} />
          {!user.root_id && <Route path="/agencies" element={<AdminAgencies />} />}
          <Route path="/tema" element={<AdminTheme user={user} onUpdate={setUser} />} />
        </Routes>
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowQR(false)} 
              className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Seu QR Code</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Os clientes podem escanear este código com a câmera do celular para acessar seu cartão digital.
            </p>
            
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-[2rem] p-6 mb-8 flex justify-center">
               <QRCodeCanvas 
                 id="qr-gen"
                 value={`${window.location.origin}/${user?.slug}`} 
                 size={200} 
                 bgColor={"#ffffff"}
                 fgColor={"#000000"}
                 level={"H"}
               />
            </div>

            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              <Download className="w-5 h-5" />
              Baixar Código (Impresão)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
