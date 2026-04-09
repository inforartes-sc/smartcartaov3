import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ChevronRight, 
  Smartphone, 
  Zap, 
  Globe,
  Users, 
  BarChart3, 
  MessageCircle, 
  ChevronDown,
  Menu,
  X,
  CreditCard,
  ArrowRight,
  Star,
  Clock,
  Layout,
  MousePointer2,
  CheckCircle,
  TrendingUp,
  LayoutTemplate,
  Image as ImageIcon,
  Crown,
  Timer,
  CalendarDays,
  Gem,
  UserCheck,
  Rocket,
  Images,
  User,
  ShieldCheck,
  ArrowUp
} from 'lucide-react';

const PLAN_THEMES: Record<string, any> = {
  individual: {
    icon: 'text-slate-400',
    border: 'border-slate-500/40',
    btn: 'bg-slate-800 text-slate-300 hover:bg-slate-700',
    glow: 'shadow-[0_0_30px_rgba(148,163,184,0.08)] group-hover:shadow-[0_0_50px_rgba(148,163,184,0.15)] transition-all'
  },
  bronze: {
    icon: 'text-orange-400',
    border: 'border-orange-500/40',
    btn: 'bg-orange-600 text-white hover:bg-orange-500',
    glow: 'shadow-[0_0_30px_rgba(251,146,60,0.08)] group-hover:shadow-[0_0_50px_rgba(251,146,60,0.15)] transition-all'
  },
  silver: {
    icon: 'text-blue-400',
    border: 'border-blue-500/60',
    btn: 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_70px_rgba(59,130,246,0.3)] transition-all'
  },
  gold: {
    icon: 'text-amber-400',
    border: 'border-amber-500/40',
    btn: 'bg-amber-600 text-white hover:bg-amber-500 shadow-amber-900/40',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.08)] group-hover:shadow-[0_0_50px_rgba(251,191,36,0.15)] transition-all'
  }
};

const getPlanTheme = (planId: any) => {
  const idStr = String(planId).toLowerCase();
  if (idStr === '1' || idStr === 'individual') return PLAN_THEMES.individual;
  if (idStr === '2' || idStr === 'bronze') return PLAN_THEMES.bronze;
  if (idStr === '3' || idStr === 'silver') return PLAN_THEMES.silver;
  if (idStr === '4' || idStr === 'gold') return PLAN_THEMES.gold;
  return PLAN_THEMES.silver; // Default
};

export default function LandingPage() {
  const [settings, setSettings] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentExample, setCurrentExample] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings?t=' + Date.now()).then(res => res.json()).catch(() => ({})),
      fetch('/api/public/plans?t=' + Date.now()).then(res => res.json()).catch(() => []),
      fetch('/api/testimonials?t=' + Date.now()).then(res => res.json()).catch(() => [])
    ]).then(([settingsData, plansData, testimonialsData]) => {
      setSettings(settingsData);
      setTestimonials(testimonialsData);
      
      const defaultPlans = [
        { 
          id: 'individual', 
          name: 'Individual', 
          price: '49,00', 
          description: 'Ideal para profissionais liberais que buscam presença digital imediata.', 
          features: 'Link Personalizado, Redes Sociais, QR Code Único, Suporte via Ticket, Catálogo Completo', 
          quota: '1 Cartão',
          agencies: 'Sem Filiais',
          billing_cycle: 'monthly', 
          months: 1,
          is_popular: false 
        },
        { 
          id: 'bronze', 
          name: 'Bronze', 
          price: '249,00', 
          description: 'Plano Semestral focado em pequenas equipes e crescimento acelerado.', 
          features: 'Tudo do Individual, 15% de Desconto, Banner Animado, Métricas de Visitas, Suporte Prioritário', 
          quota: '5 Cartões',
          agencies: 'Até 2 Filiais',
          billing_cycle: 'monthly', 
          months: 6,
          is_popular: false 
        },
        { 
          id: 'silver', 
          name: 'Silver', 
          price: '299,00', 
          description: 'A escolha ideal para empresas em expansão com múltiplas unidades.', 
          features: 'Tudo do Bronze, Gestão de Equipe, Relatórios Avançados, Selo de Verificado, Suporte VIP 24h', 
          quota: '15 Cartões',
          agencies: 'Até 5 Filiais',
          billing_cycle: 'monthly', 
          months: 12,
          is_popular: true 
        },
        { 
          id: 'gold', 
          name: 'Gold', 
          price: '399,00', 
          description: 'Domínio total do mercado com recursos exclusivos e suporte de elite.', 
          features: 'Tudo do Silver, 30% de Desconto, Domínio Próprio, Sem Logo SmartCartão, Consultoria de Marketing', 
          quota: 'Ilimitado',
          agencies: 'Filiais Ilimitadas',
          billing_cycle: 'monthly', 
          months: 12,
          is_popular: false 
        }
      ];

      // Merge logic: Use DB data if available, otherwise use defaults
      if (!plansData || plansData.length === 0) {
        setPlans(defaultPlans);
      } else {
        const mergedPlans = plansData.map((p: any) => {
          const def = defaultPlans.find(d => d.name.toLowerCase() === p.name.toLowerCase());
          return {
            ...p,
            price: (p.price && p.price !== '0' && p.price !== '0,00') ? p.price : (def?.price || '0,00'),
            description: (p.description && p.description.trim() !== '') ? p.description : (def?.description || ''),
            features: (p.features && p.features.trim() !== '') ? p.features : (def?.features || ''),
            is_popular: p.is_popular === true || p.is_popular === 1 || p.is_popular === 'true'
          };
        });
        setPlans(mergedPlans);
      }
    }).catch(err => {
      console.error('Error fetching landing data:', err);
    }).finally(() => setLoading(false));
  }, []);

  // Carousel timer
  useEffect(() => {
    if (testimonials.length === 0) return;
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials]);

  // Helper for fallbacks
  const getS = (key: string, def: string) => (settings && settings[key] !== undefined && settings[key] !== null) ? settings[key] : def;

  const exampleImages = [
    getS('landing_example1', '/landing/examples.png'),
    getS('landing_example2', '/landing/examples.png'),
    getS('landing_example3', '/landing/examples.png'),
    getS('landing_example4', '/landing/examples.png')
  ];

  // Timer para o carrossel de imagens de exemplo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % exampleImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [exampleImages.length]);

  const features = [
    {
      icon: <LayoutTemplate className="w-10 h-10" />,
      title: "Catálogo Profissional",
      description: "Organize seus produtos por categorias, marcas e anos com filtros inteligentes.",
      color: "bg-blue-500"
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: "Vendas no WhatsApp",
      description: "Seus clientes escolhem os produtos e enviam o carrinho direto para o seu WhatsApp.",
      color: "bg-green-500"
    },
    {
      icon: <TrendingUp className="w-10 h-10" />,
      title: "Aumento de Conversão",
      description: "Interface intuitiva e rápida que elimina a indecisão e acelera o fechamento.",
      color: "bg-red-500"
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "App no Celular",
      description: "Pode ser 'instalado' como um aplicativo (PWA) na tela inicial do seu cliente.",
      color: "bg-purple-500"
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Métricas Reais",
      description: "Saiba quais produtos são mais vistos e entenda o comportamento da sua audiência.",
      color: "bg-slate-800"
    },
    {
      icon: <Globe className="w-10 h-10" />,
      title: "Links Personalizados",
      description: "Adicione suas redes sociais, sites e contatos em um só lugar de forma estratégica e profissional.",
      color: "bg-indigo-600"
    }
  ];

  const registerUrl = `https://wa.me/${settings?.default_phone || '5592984488888'}?text=${encodeURIComponent('Olá, gostaria de saber mais sobre o Smart Cartão.')}`;
  
  let faqs = [
    {
      q: "O que é o Smart Cartão?",
      a: "É uma ferramenta digital definitiva para quem vende. Você recebe um link exclusivo que contém seu perfil profissional e um catálogo completo de produtos, pronto para converter visitas em vendas no WhatsApp."
    },
    {
      q: "Como funciona o pagamento dos planos?",
      a: "Você pode assinar mensalmente ou anualmente (com desconto). O pagamento é processado de forma segura e você tem acesso imediato ao painel administrativo."
    },
    {
      q: "Preciso ter CNPJ ou ser empresa?",
      a: "Não! O Smart Cartão é ideal para profissionais liberais, autônomos, lojas e qualquer pessoa que queira vender de forma mais organizada e profissional."
    },
    {
      q: "Os meus clientes precisam baixar algum app?",
      a: "Absolutamente não. Eles acessam seu link de qualquer lugar (Bio do Insta, Status, Anúncios) e navegam como se fosse um site super rápido."
    }
  ];

  if (settings?.landing_faqs) {
    try {
       const parsedFaqs = JSON.parse(settings.landing_faqs);
       if (Array.isArray(parsedFaqs) && parsedFaqs.length > 0) {
          faqs = parsedFaqs;
       }
    } catch(e) { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Carregando Experiência</p>
        </div>
      </div>
    );
  }

  const heroTitleParts = getS('landing_hero_title', 'REVOLUCIONE SUAS VENDAS').split(' ');
  const heroTitleFirst = heroTitleParts[0];
  const heroTitleRest = heroTitleParts.slice(1).join(' ');

  const conceptTitle = getS('landing_concept_title', 'MUITO MAIS QUE UM SIMPLES LINK.');
  const conceptTitleParts = conceptTitle.split(' ');
  const conceptTitleFirst = conceptTitleParts.slice(0, -1).join(' ');
  const conceptTitleLast = conceptTitleParts.pop();

  const featuresTitle = getS('landing_features_title', 'PODER PARA VENDER');
  const featuresTitleParts = featuresTitle.split(' ');
  const featuresTitleFirst = featuresTitleParts.slice(0, -1).join(' ');
  const featuresTitleLast = featuresTitleParts.pop();

  const ctaTitle = getS('landing_cta_title', 'PRONTO PARA SER REFERÊNCIA?');
  const ctaTitleParts = ctaTitle.split(' ');
  const ctaTitleFirst = ctaTitleParts.slice(0, -1).join(' ');
  const ctaTitleLast = ctaTitleParts.pop();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden text-slate-900">
      
      {/* Navigation */}
      <nav className="fixed w-full z-[60] transition-all duration-300 bg-white/70 backdrop-blur-2xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              {settings?.footer_logo || settings?.default_logo ? (
                <img src={settings.footer_logo || settings.default_logo} className="h-10 md:h-14 object-contain drop-shadow-sm" alt="Logo" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                    <Layout className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none block">Smart<span className="text-blue-600">Cartão</span></span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] block mt-1">Multi-Plataforma Profissional</span>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#features" className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Recursos</a>
              <a href="#concept" className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">O que é?</a>
              <a href="#pricing" className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors">Planos</a>
              <div className="h-6 w-px bg-slate-200"></div>
              <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-all">Entrar</Link>
              <a href={registerUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                Quero o Meu Cartão
              </a>
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-3 bg-slate-50 rounded-2xl text-slate-900">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl pt-24 px-8 md:hidden"
            >
               {/* Decorative Background Elements */}
               <div className="absolute top-20 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -z-10"></div>
               <div className="absolute bottom-40 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -z-10"></div>

               <div className="flex flex-col gap-2 text-center relative z-10">
                 {['RECURSOS', 'O QUE É?', 'PLANOS'].map((item) => (
                   <a 
                     key={item}
                     href={`#${item.toLowerCase().replace(' ', '-').replace('?', '')}`} 
                     onClick={() => setMobileMenuOpen(false)} 
                     className="py-5 text-2xl font-black text-white uppercase tracking-tighter italic hover:text-blue-400 transition-colors"
                   >
                     {item}
                   </a>
                 ))}
                 
                 <div className="mt-8 pt-10 border-t border-white/5 flex flex-col gap-10">
                    <Link 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="text-xl font-black uppercase text-slate-400 hover:text-white transition-colors tracking-widest"
                    >
                      Entrar na Plataforma
                    </Link>
                    <a 
                      href={registerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mx-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-lg shadow-[0_20px_50px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/10 outline outline-1 outline-blue-400/20"
                    >
                      COMEÇAR AGORA <ArrowRight className="w-7 h-7" />
                    </a>
                 </div>
               </div>
           </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-slate-50/50 -skew-x-12 translate-x-32 -z-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-7 text-center lg:text-left"
              >
                 {/* Badge removido para limpeza do Hero */}
                
                <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter uppercase italic">
                   {heroTitleFirst} <br />
                   <span className="text-blue-600 not-italic">{heroTitleRest}</span>
                </h1>
                
                <p className="text-lg lg:text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium font-heading">
                  {getS('landing_hero_subtitle', 'Essa é a ferramenta definitiva que os grandes vendedores usam para dominar o mercado digital.')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <a href={registerUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-blue-700 hover:shadow-[0_20px_50px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center gap-4 group">
                    {getS('landing_hero_cta', 'Começar Agora')}
                    <div className="p-1 bg-white/20 rounded-lg group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </a>
                  <a href="#concept" className="bg-white border-2 border-slate-100 text-slate-900 px-12 py-6 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm">
                    Ver Exemplo
                  </a>
                </div>

                 {/* Prova social movida para seção exclusiva abaixo do hero */}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, type: "spring" }}
                className="lg:col-span-5 relative"
              >
                 <div className="relative z-10 w-[280px] sm:w-[320px] h-[580px] sm:h-[650px] mx-auto border-[10px] sm:border-[12px] border-slate-900 rounded-[3.5rem] sm:rounded-[4rem] bg-white shadow-[0_40px_80px_-20px_rgba(15,23,42,0.4)] hover:translate-y-[-10px] transition-transform duration-700 flex flex-col group">
                    {/* Dynamic Island / Notch */}
                    <div className="absolute top-0 w-[40%] h-7 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-[1.2rem] z-20"></div>
                    
                    <div className="w-full h-full bg-slate-50 rounded-[2.8rem] sm:rounded-[3.2rem] overflow-hidden pt-12 pb-6 relative shadow-inner">
                      {getS('landing_mockup_hero', '') ? (
                        <img src={getS('landing_mockup_hero', '')} alt="Smart Cartão Mockup" className="absolute inset-0 w-full h-full object-cover object-top z-10" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white text-center">
                           <ImageIcon className="w-16 h-16 text-blue-200 mb-4" />
                           <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-tight">Mockup<br/>Principal</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Floating Info hover removed by user request */}
                 </div>

                 {/* Decorative Blobs */}
                 <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 blur-[100px] -z-10 rounded-full"></div>
                 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[100px] -z-10 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Brand Bar / Trust */}
        <div className="py-12 bg-slate-50 border-y border-slate-100 italic">
           <div className="max-w-7xl mx-auto px-4 overflow-hidden">
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                 <span className="text-2xl font-black tracking-tighter">INSTAGRAM</span>
                 <span className="text-2xl font-black tracking-tighter">WHATSAPP</span>
                 <span className="text-2xl font-black tracking-tighter">FACEBOOK</span>
                 <span className="text-2xl font-black tracking-tighter">TIKTOK</span>
                 <span className="text-2xl font-black tracking-tighter">MERCADO PAGO</span>
              </div>
           </div>
        </div>

        {/* Seção de Conceito - O que é? */}
        <section id="concept" className="py-12 md:py-24 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                 <div className="order-2 lg:order-1 relative group max-w-lg mx-auto w-full">
                    <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] bg-slate-50 rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                       <AnimatePresence initial={false}>
                          <motion.div
                             key={currentExample}
                             initial={{ x: "100%" }}
                             animate={{ x: 0 }}
                             exit={{ x: "-100%" }}
                             transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                             className="absolute inset-0 w-full h-full p-4 md:p-8"
                          >
                             <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 relative group-hover:shadow-2xl transition-shadow duration-500">
                                {exampleImages[currentExample] && (exampleImages[currentExample].includes('/landing/') || exampleImages[currentExample].startsWith('http')) ? (
                                   <img 
                                      src={exampleImages[currentExample]} 
                                      alt={`Exemplo ${currentExample + 1}`} 
                                      className="w-full h-full object-cover transform transition-transform duration-[2000ms] group-hover:scale-110" 
                                   />
                                ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                                      <ImageIcon className="w-20 h-20 mb-4 opacity-20" />
                                      <p className="text-xs font-black uppercase tracking-widest text-slate-300">Exemplo {currentExample + 1}</p>
                                   </div>
                                )}
                             </div>
                          </motion.div>
                       </AnimatePresence>

                       {/* Pontos de Navegação */}
                       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                          {exampleImages.map((_, i) => (
                             <button
                                key={i}
                                onClick={() => setCurrentExample(i)}
                                className={`h-2 transition-all duration-500 rounded-full ${
                                   currentExample === i ? "w-8 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                                }`}
                                aria-label={`Ir para slide ${i + 1}`}
                             />
                          ))}
                       </div>
                    </div>
                    
                    {/* Elementos Decorativos de Fundo */}
                    <div className="absolute -z-10 -top-10 -left-10 w-40 h-40 bg-blue-600/5 blur-3xl rounded-full"></div>
                    <div className="absolute -z-10 -bottom-10 -right-10 w-60 h-60 bg-indigo-600/5 blur-3xl rounded-full"></div>
                 </div>
                 <div className="order-1 lg:order-2 space-y-8">
                    <h2 className="text-blue-600 text-xs font-black uppercase tracking-[0.4em] mb-4">O que é um Cartão Digital?</h2>
                    
                    <h3 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none text-balance">
                      {conceptTitleFirst} <br />
                      <span className="text-blue-600 not-italic">{conceptTitleLast}</span>
                    </h3>

                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                       {getS('landing_concept_subtitle', 'É sua identidade profissional completa no bolso do seu cliente. Unimos seu perfil social, contatos imediatos e um catálogo interativo de produtos em uma única página de alta performance.')}
                    </p>
                    <div className="space-y-6 pt-4">
                       {[
                         { t: getS('landing_concept_item1_t', "100% Personalizado"), d: getS('landing_concept_item1_d', "Sua logo, suas cores, suas fotos. Nada de layouts genéricos.") },
                         { t: getS('landing_concept_item2_t', "Lead Direto no WhatsApp"), d: getS('landing_concept_item2_d', "Sem carrinhos complexos. O cliente clica e já está falando com você.") },
                         { t: getS('landing_concept_item3_t', "Atualizações Ilimitadas"), d: getS('landing_concept_item3_d', "Mudou o produto? Atualize em 1 minuto e todos vêem na hora.") }
                       ].map((item, idx) => (
                         <div key={idx} className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                               <Check className="w-4 h-4" strokeWidth={4} />
                            </div>
                            <div>
                               <h5 className="font-black text-slate-900 uppercase tracking-tight text-sm">{item.t}</h5>
                               <p className="text-slate-500 text-xs font-medium">{item.d}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="pt-8">
                       <a href={registerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
                          QUERO O MEU AGORA <ChevronRight className="w-4 h-4" />
                       </a>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-12 md:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-blue-600 text-[10px] font-black uppercase tracking-[0.5em] mb-4 text-center">Funcionalidades</h2>
              
              <h3 className="text-2xl lg:text-4xl font-black text-slate-900 tracking-tighter font-heading mb-6 leading-none uppercase">
                {featuresTitleFirst} <span className="text-blue-600 italic underline decoration-blue-200 decoration-8 underline-offset-4">{featuresTitleLast}</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-500 group flex flex-col items-center text-center">
                  <div className={`w-20 h-20 ${f.color} rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-xl group-hover:rotate-12 transition-all duration-500`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight font-heading">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium text-sm">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Custom Service (Done For You) */}
        <section className="py-16 md:py-28 bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white overflow-hidden relative">
          <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[140%] bg-red-500/20 rotate-12 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="order-2 lg:order-1 text-center lg:text-left"
              >
                <div className="inline-block px-4 py-1.5 bg-red-900/40 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-red-500/50 shadow-inner">
                  {getS('landing_done_tag', 'VOCÊ NÃO PRECISA SABER EDITAR!')}
                </div>
                <h3 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase italic leading-[1.05] mb-6 text-balance drop-shadow-lg">
                  {getS('landing_done_title_first', 'NÓS MONTAMOS')} <br />
                  <span className="text-red-200 not-italic">{getS('landing_done_title_last', 'TUDO POR VOCÊ!')}</span>
                </h3>
                <p className="text-lg text-red-50 mb-10 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                  {getS('landing_done_text', 'Não esquente a cabeça com configurações difíceis. Nossa equipe especialista vai arregaçar as mangas e fazer todo o seu Cartão Digital: desde a estrutura até o cadastro dos seus contatos e produtos. Você só precisa nos enviar as informações e nós entregamos seu material pronto para uso!')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-3xl border border-white/20 hover:bg-white/15 transition-colors">
                    <div className="w-12 h-12 bg-white text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-widest text-red-200 font-bold">Experiência</p>
                      <p className="text-sm font-black text-white uppercase tracking-tight">Zero Estresse</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-3xl border border-white/20 hover:bg-white/15 transition-colors">
                    <div className="w-12 h-12 bg-white text-red-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-widest text-red-200 font-bold">Entrega</p>
                      <p className="text-sm font-black text-white uppercase tracking-tight">Ultra Rápida</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="order-1 lg:order-2 relative"
              >
                <div className="relative w-[300px] h-[580px] border-[10px] border-slate-900 rounded-[3.5rem] bg-slate-900 shadow-[0_40px_80px_rgba(0,0,0,0.4)] mx-auto transform rotate-[-4deg] hover:rotate-[2deg] transition-transform duration-700 z-20">
                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-0 w-[40%] h-7 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-[1.2rem] z-20"></div>
                  
                  {/* Internal Screen */}
                  <div className="w-full h-full bg-red-600 rounded-[2.8rem] overflow-hidden pt-12 pb-6 px-5 flex flex-col items-center relative">
                     {getS('landing_mockup_service', '') ? (
                       <img src={getS('landing_mockup_service', '')} alt="Design Serviço" className="absolute inset-0 w-full h-full object-cover object-top z-10" />
                     ) : (
                       <>
                         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500 to-transparent pointer-events-none"></div>
                         
                         <div className="w-24 h-24 bg-white rounded-full border-4 border-white mb-4 flex items-center justify-center shadow-xl relative z-10 overflow-hidden">
                            <img src="https://i.pravatar.cc/150?img=60" alt="Consultor" className="w-full h-full object-cover" />
                         </div>
                         <div className="w-32 h-4 bg-white shadow-sm rounded-full mb-1 z-10"></div>
                         <div className="w-20 h-3 bg-red-800/30 rounded-full mb-8 z-10"></div>
                         
                         <div className="w-full space-y-3 mb-6 z-10">
                            <div className="w-full h-12 bg-white rounded-2xl shadow-md flex items-center px-4 hover:scale-[1.02] transition-transform">
                               <MessageCircle className="w-5 h-5 text-green-500 mr-3" />
                               <div className="w-28 h-2.5 bg-slate-200 rounded-full"></div>
                            </div>
                            <div className="w-full h-12 bg-white rounded-2xl shadow-md flex items-center px-4 hover:scale-[1.02] transition-transform">
                               <Images className="w-5 h-5 text-blue-500 mr-3" />
                               <div className="w-28 h-2.5 bg-slate-200 rounded-full"></div>
                            </div>
                         </div>
                         
                         <div className="w-full flex-grow bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 z-10 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                               <div className="w-20 h-3 bg-red-200/50 rounded-full"></div>
                               <div className="w-10 h-3 bg-red-200/50 rounded-full"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 flex-grow">
                               <div className="bg-white rounded-xl shadow-lg relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-slate-800 opacity-20 group-hover:opacity-0 transition-opacity"></div>
                               </div>
                               <div className="bg-white rounded-xl shadow-lg relative overflow-hidden group">
                                  <div className="absolute inset-0 bg-slate-800 opacity-20 group-hover:opacity-0 transition-opacity"></div>
                               </div>
                            </div>
                         </div>
                       </>
                     )}
                  </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-10 -right-4 w-16 h-16 bg-yellow-400 rounded-full blur-[30px] opacity-60 z-10"></div>
                <div className="absolute -bottom-10 -left-10 text-white/10 z-10 rotate-12">
                   <Star className="w-32 h-32 fill-current" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Section: Catalog Features */}
        <section className="py-16 md:py-28 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-5 relative"
              >
                 <div className="relative">
                   {/* Background Decorative Phone */}
                   <div className="absolute top-10 left-[-40px] w-[260px] h-[520px] border-[8px] border-slate-800 rounded-[3rem] bg-indigo-900/50 shadow-2xl opacity-60 scale-90 -rotate-12 transition-transform hover:rotate-[-6deg] duration-700">
                     <div className="w-full h-full bg-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-sm pointer-events-none p-4 opacity-30">
                        <div className="w-full h-24 bg-white/20 rounded-2xl mb-4"></div>
                        <div className="space-y-3">
                           <div className="w-full h-12 bg-white/20 rounded-xl"></div>
                           <div className="w-full h-12 bg-white/20 rounded-xl"></div>
                        </div>
                     </div>
                   </div>
                   
                   {/* Foreground Hero Phone */}
                   <div className="relative w-[280px] h-[580px] border-[10px] border-slate-900 rounded-[3.5rem] bg-slate-50 shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-10 mx-auto hover:translate-y-[-10px] transition-transform duration-700">
                     {/* Dynamic Island */}
                     <div className="absolute top-0 w-[40%] h-7 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-[1.2rem] z-20"></div>
                     <div className="w-full h-full bg-slate-100 rounded-[2.8rem] overflow-hidden pt-12 pb-6 flex flex-col shadow-inner relative">
                        {getS('landing_mockup_features', '') ? (
                           <img src={getS('landing_mockup_features', '')} alt="Mockup Features" className="absolute inset-0 w-full h-full object-cover object-top z-10" />
                        ) : (
                           <>
                              <div className="px-5 pb-5 border-b border-slate-200 flex items-center justify-between bg-white pt-2">
                                 <div className="w-12 h-12 rounded-full border-2 border-blue-500 p-0.5">
                                    <img src="https://i.pravatar.cc/150?img=33" alt="Admin" className="w-full h-full rounded-full object-cover" />
                                 </div>
                                 <div className="flex-1 px-3">
                                    <div className="w-16 h-2.5 rounded-full bg-slate-800 mb-1.5"></div>
                                    <div className="w-24 h-2 rounded-full bg-slate-300"></div>
                                 </div>
                              </div>
                              <div className="flex-grow p-4 overflow-hidden bg-slate-100/50 space-y-4">
                                 {/* Highlight/Featured Item */}
                                 <div className="w-full bg-white rounded-3xl p-3 shadow-sm border border-slate-200">
                                    <div className="aspect-[4/3] bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                                       <div className="absolute top-2 left-2 bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full">Destaque</div>
                                    </div>
                                    <div className="px-1 space-y-2 mb-3">
                                       <div className="w-3/4 h-3 bg-slate-800 rounded-full"></div>
                                       <div className="w-1/2 h-4 bg-green-500 rounded-full"></div>
                                    </div>
                                    <div className="w-full h-10 bg-slate-900 rounded-xl mb-2 flex items-center justify-center">
                                       <div className="w-1/3 h-2 bg-white/30 rounded-full"></div>
                                    </div>
                                    <div className="w-full h-10 bg-green-500 rounded-xl flex items-center justify-center">
                                       <div className="w-1/2 h-2 bg-white/40 rounded-full"></div>
                                    </div>
                                 </div>
                              </div>
                           </>
                        )}
                     </div>
                   </div>
                   
                   {/* Blur Glow */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/30 blur-[60px] rounded-full -z-10 pointer-events-none"></div>
                 </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-7"
              >
                <div className="inline-block px-4 py-1.5 bg-blue-900/40 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-blue-500/30">
                  {getS('landing_catalog_tag', 'RECURSOS EXCLUSIVOS')}
                </div>
                <h3 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic leading-[1.05] mb-8 text-balance drop-shadow-md">
                  {getS('landing_catalog_title_first', 'O PODER DO SEU')} <br />
                  <span className="text-blue-400 not-italic border-b-4 border-blue-500 pb-1">{getS('landing_catalog_title_last', 'CATÁLOGO DIGITAL')}</span>
                </h3>
                
                <p className="text-slate-300 mb-10 text-lg leading-relaxed font-medium">
                  {getS('landing_catalog_text', 'Construído para maximizar seus resultados. Uma experiência fluida que guia seu cliente até o fechamento da venda, sem distrações.')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center shrink-0 text-indigo-300 shadow-inner">
                      <LayoutTemplate className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] uppercase tracking-tight text-white mb-2">Catálogo Super Rápido</h4>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">Mostre preços e modelos atualizados instantaneamente. Otimizado para celular.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-green-500/10 border border-green-400/20 flex items-center justify-center shrink-0 text-green-400 shadow-inner">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] uppercase tracking-tight text-white mb-2">Botão do WhatsApp</h4>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">Seu cliente escolhe o produto e te chama direto no aplicativo de mensagens com um clique.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 border border-amber-400/20 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] uppercase tracking-tight text-white mb-2">Sobre o Produto</h4>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">Forneça todos os detalhes importantes sobre o produto direto na página dedicada.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-blue-500/10 border border-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 shadow-inner">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] uppercase tracking-tight text-white mb-2">Botões de Conversão</h4>
                      <p className="text-slate-400 font-medium text-sm leading-relaxed">Links diretos para financiamento, formulários de pré-cadastro e sistemas exclusivos como Liberacred.</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 pt-8 border-t border-white/10">
                   <a 
                    href={getS('landing_catalog_btn_link', '') || registerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/50"
                   >
                     {getS('landing_catalog_btn_text', 'VER NA PRÁTICA')} <ArrowRight className="w-5 h-5" />
                   </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 bg-slate-900 text-white relative">
          <div className="absolute inset-0 bg-blue-600/5 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-16 transition-all duration-700">
              <h2 className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-6 font-black">Planos de Acesso</h2>
              <h3 className="text-2xl lg:text-5xl font-black text-white tracking-tighter font-heading mb-8 leading-none uppercase italic">
                  ESCOLHA SEU <span className="text-blue-400 not-italic ml-2">PODER!</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {plans.map((plan) => {
                const theme = getPlanTheme(plan.id);
                return (
                  <div 
                    key={plan.id}
                    className={`group relative p-6 rounded-[2rem] border-2 transition-all duration-700 flex flex-col h-full bg-[#111827]/80 backdrop-blur-xl ${theme.border} ${theme.glow} z-10`}
                  >
                    {plan.is_popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 z-20">
                         <Crown className="w-4 h-4" /> RECOMENDADO
                      </div>
                    )}

                    <div className="mb-3">
                       <div className="flex items-center gap-4 mb-4">
                          <div className="bg-slate-900/60 p-2.5 rounded-xl flex-shrink-0">
                             {(String(plan.id) === '1' || plan.id === 'individual') && <User className={`w-5 h-5 ${theme.icon}`} />}
                             {(String(plan.id) === '2' || plan.id === 'bronze') && <Timer className={`w-5 h-5 ${theme.icon}`} />}
                             {(String(plan.id) === '3' || plan.id === 'silver') && <ShieldCheck className={`w-5 h-5 ${theme.icon}`} />}
                             {(String(plan.id) === '4' || plan.id === 'gold') && <Crown className={`w-5 h-5 ${theme.icon}`} />}
                          </div>
                          <h4 className="text-base md:text-sm font-black text-white tracking-widest uppercase leading-tight">{plan.name}</h4>
                       </div>
                     
                     <div className="text-left pl-1">
                       <div className="mb-3 w-full bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/40 text-center animate-pulse group-hover:animate-none group-hover:bg-emerald-500/20 transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.1)] text-balance">
                          <span className="text-[11px] md:text-[9px] font-black text-emerald-400 uppercase tracking-[0.1em] leading-none whitespace-nowrap">
                             {getS('semiannual_discount', '15')}% OFF Semestral / {getS('annual_discount', '30')}% OFF Anual
                          </span>
                       </div>
                       <div className="flex items-start gap-1 mb-1">
                          <span className="text-base md:text-sm font-black text-slate-400 mt-1.5 italic">R$</span>
                          <span className="text-5xl md:text-4xl font-black text-white tracking-tighter italic leading-none">{plan.price}</span>
                          <span className="text-xs md:text-[10px] font-bold text-slate-500 uppercase tracking-widest self-end pb-1.5">/ {plan.billing_cycle === 'annual' || plan.billing_cycle === 'yearly' ? 'Ano' : 'Mensal'}</span>
                       </div>
                    </div>
                    </div>

                    <p className="text-sm md:text-xs text-slate-400 font-medium leading-relaxed italic mb-4 border-l-2 border-white/5 pl-4">{plan.description}</p>

                   <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center shadow-inner group-hover:border-white/20 transition-all">
                         <p className="text-[9px] md:text-[8px] font-black text-slate-500 uppercase mb-1">Cota de Uso</p>
                         <p className="text-base md:text-[11px] font-black text-white uppercase">{plan.quota}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center shadow-inner group-hover:border-white/20 transition-all">
                         <p className="text-[9px] md:text-[8px] font-black text-slate-500 uppercase mb-1">Filiais</p>
                         <p className="text-base md:text-[11px] font-black text-white uppercase">{plan.agencies}</p>
                      </div>
                   </div>

                   <div className="space-y-2 mb-6 flex-grow">
                     {plan.features?.split(',').map((feat: any, idx: number) => (
                       <div key={idx} className="flex items-center gap-4">
                         <div className="flex-shrink-0 bg-blue-500/20 p-1.5 rounded-md">
                            <Check className="w-3.5 h-3.5 text-blue-400" strokeWidth={4} />
                         </div>
                         <span className="text-[13px] md:text-[11px] font-bold text-slate-300 uppercase tracking-tight leading-none text-balance">{feat.trim()}</span>
                       </div>
                     ))}
                   </div>

                  <a 
                    href={settings?.register_url || '/register'}
                    target="_blank"
                    className={`w-full py-4 rounded-xl font-black text-center transition-all uppercase tracking-widest text-[10px] shadow-lg mt-auto ${theme.btn}`}
                  >
                    Ativar Agora
                  </a>
                </div>
              );
            })}
            </div>
          </div>
        </section>

        {/* Seção Exclusiva: Autoridade & Avaliações */}
        <section id="reviews" className="py-12 md:py-20 bg-white relative overflow-hidden border-b border-slate-100">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 p-12 bg-slate-50/50 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
                 
                 <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6 lg:max-w-xl">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20">
                       <Star className="w-3 h-3 fill-current" /> SUCESSO COMPROVADO
                    </div>
                    
                    <h3 className="text-3xl lg:text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">
                       {getS('landing_stats_text', '+425 Clientes Satisfeitos')}
                    </h3>
                    
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                       {getS('landing_stats_description', 'Nossa plataforma é a escolha número #1 de consultores e vendedores que buscam profissionalismo, velocidade e resultados reais no mercado digital.')}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-4">
                       <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                             {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />)}
                          </div>
                          <span className="font-black text-slate-900 text-sm tracking-tight">4.9/5 IMPECÁVEL</span>
                       </div>
                       <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                       <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle className="w-4 h-4" /> VERIFICADO POR SMART CARTÃO
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col items-center justify-center min-h-[300px] w-full lg:w-[450px]">
                    <AnimatePresence mode="wait">
                       {testimonials.length > 0 ? (
                         <motion.div
                           key={currentTestimonial}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-blue-900/10 border border-slate-100 flex flex-col gap-6 relative group w-full"
                         >
                            <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl italic rotate-[-10deg]">
                               "
                            </div>
                            
                            <p className="text-xl text-slate-700 font-medium leading-relaxed italic">
                               {testimonials[currentTestimonial].content}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                               <div>
                                  <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none mb-1">
                                     {testimonials[currentTestimonial].name}
                                  </h4>
                                  <div className="flex gap-0.5">
                                     {[...Array(testimonials[currentTestimonial].rating || 5)].map((_, i) => (
                                       <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-current" />
                                     ))}
                                  </div>
                               </div>
                               <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  Depoimento Real
                               </div>
                            </div>
                         </motion.div>
                       ) : (
                         <div className="text-slate-300 font-bold uppercase italic text-center">
                            Carregando depoimentos...
                         </div>
                       )}
                    </AnimatePresence>
                    
                    {/* Carousel Indicators */}
                    {testimonials.length > 1 && (
                      <div className="flex gap-2 mt-8">
                        {testimonials.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentTestimonial(i)}
                            className={`h-1.5 transition-all duration-300 rounded-full ${i === currentTestimonial ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                          />
                        ))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </section>

        {/* FAQ Section */}
        <section className="pt-12 md:pt-24 pb-8 md:pb-12 bg-white relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-slate-300 font-black text-7xl uppercase tracking-tighter opacity-10 absolute left-0 right-0 top-16 select-none pointer-events-none">PERGUNTAS</h2>
               <h3 className="text-3xl lg:text-5xl font-black text-slate-900 font-heading tracking-tighter uppercase leading-none">ESTÁ COM ALGUMA <br /><span className="text-blue-600">DÚVIDA?</span></h3>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-slate-100 rounded-[2rem] border border-slate-200 hover:border-blue-200 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md">
                  <button 
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full py-4 px-8 text-left flex items-center justify-between group"
                  >
                    <span className="font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight text-sm truncate pr-4">{faq.q}</span>
                    <div className={`p-2.5 rounded-xl transition-all ${activeFaq === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-400 group-hover:text-blue-600 border border-slate-200 shadow-inner'}`}>
                       <ChevronDown className={`w-4 h-4 transition-transform duration-700 ${activeFaq === i ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-8 pt-0 text-slate-600 font-medium leading-relaxed italic text-sm">
                           <div className="h-px w-12 bg-blue-100 mb-6"></div>
                           {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pt-8 md:pt-12 pb-16 md:pb-32 bg-white relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-4 relative z-10">
              <div className="bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-10 md:p-24 text-center relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(15,23,42,0.15)]">
                 <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>
                 <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
                 
                 <h2 className="text-2xl lg:text-4xl font-black text-white mb-8 tracking-tighter leading-none uppercase italic text-balance">
                    {ctaTitleFirst} <span className="text-blue-500 not-italic underline decoration-blue-500/30 decoration-8 underline-offset-8 ml-2">{ctaTitleLast}</span>
                 </h2>
                 <p className="text-slate-400 text-lg lg:text-xl mb-14 max-w-2xl mx-auto font-medium">
                    {getS('landing_cta_subtitle', 'Você está a 5 minutes de ter uma presença digital que vende por você 24 horas por dia.')}
                 </p>
                  <div className="flex flex-col sm:flex-row gap-5 justify-center">
                    <a href={registerUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-900 px-8 py-5 md:px-14 md:py-7 rounded-[2rem] md:rounded-[2.5rem] font-black text-lg md:text-xl uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95 leading-tight">
                       {getS('landing_cta_button', 'QUERO MEU CATÁLOGO')}
                    </a>
                  </div>
                 <div className="mt-12 flex items-center justify-center gap-6 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">
                    <span className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Setup Rápido</span>
                    <span className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Sem Cartão</span>
                    <span className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500" /> Suporte VIP</span>
                 </div>
              </div>
           </div>
        </section>
      </main>

      {/* Footer Profissional */}
      <footer className="bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 text-center md:text-left flex flex-col items-center md:items-start">
              <div className="mb-6 inline-block">
                {settings?.footer_logo || settings?.default_logo ? (
                  <img src={settings.footer_logo || settings.default_logo} alt="Logo" className="h-16 sm:h-20 object-contain drop-shadow-sm" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                      <Layout className="w-7 h-7" />
                    </div>
                    <span className="text-2xl font-black text-slate-800 tracking-tighter uppercase font-heading">Smart<span className="text-blue-600">Cartão</span></span>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
                 A solução definitiva para profissionais que buscam autoridade, alta conversão e uma vitrine digital de altíssimo nível.
              </p>
            </div>
            
            <div className="md:col-span-3 text-center md:text-left">
               <h4 className="text-slate-900 font-black uppercase tracking-widest text-[11px] mb-6 border-l-4 border-blue-600 pl-3 md:inline-block">Links Úteis</h4>
               <ul className="space-y-4 text-sm font-bold text-slate-600">
                  <li><a href="#concept" className="hover:text-blue-600 transition-colors uppercase tracking-tight">Como Funciona</a></li>
                  <li><a href="#features" className="hover:text-blue-600 transition-colors uppercase tracking-tight">Recursos Inclusos</a></li>
                  <li><a href="#pricing" className="hover:text-blue-600 transition-colors uppercase tracking-tight">Planos de Acesso</a></li>
                  <li><Link to="/login" className="hover:text-blue-600 transition-colors uppercase tracking-tight text-blue-600">Acessar Sistema</Link></li>
               </ul>
            </div>

            <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start">
               <h4 className="text-slate-900 font-black uppercase tracking-widest text-[11px] mb-6 border-l-4 border-green-500 pl-3 md:inline-block">Suporte Premium</h4>
               
               <a 
                 href={`https://wa.me/${settings?.default_phone?.replace(/\D/g, '') || '5592984488888'}?text=${encodeURIComponent('Olá, preciso de mais informações sobre a plataforma.')}`} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="mb-8 w-full max-w-[280px] flex items-center justify-center gap-3 px-6 py-4 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 hover:shadow-xl hover:shadow-[#25D366]/30 transition-all border border-green-500"
               >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  Atendimento WhatsApp
               </a>

               <div className="flex flex-col gap-3 w-full max-w-[280px] text-left">
                 <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                       <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verificado</p>
                       <p className="text-xs font-black uppercase tracking-tight text-slate-800">Ambiente Seguro</p>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Gestão Financeira</p>
                    <div className="w-full flex items-center justify-center">
                       <img 
                         src="https://vdbdxfdjkycppdpbexri.supabase.co/storage/v1/object/public/logos/company-logos/ab4841d3-bcce-4621-b2c8-bcb4630f6619-0.4108661170281831.png" 
                         alt="PagixyPay" 
                         className="w-full max-h-11 object-contain" 
                       />
                    </div>
                 </div>
               </div>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed text-center md:text-left max-w-xl">
                {settings?.footer_text || 'Copyright © Smart Cartão - Todos os direitos reservados.'}
                <br />
                <span className="opacity-60">Este sistema utiliza a plataforma de pagamento <span className="text-blue-600">PagixyPay</span> como meio oficial.</span>
             </p>
             <div className="flex items-center gap-3 bg-white px-4 py-2 border border-slate-200 rounded-full shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Sistemas Inteligentes</p>
             </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hidden md:flex fixed bottom-10 right-10 w-14 h-14 bg-slate-900 text-white rounded-full items-center justify-center shadow-2xl shadow-slate-900/40 hover:bg-blue-600 hover:shadow-blue-600/40 hover:-translate-y-1 hover:scale-105 active:scale-95 transition-all z-[100] border border-white/10 group overflow-hidden"
            aria-label="Voltar ao topo"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <ArrowUp className="w-6 h-6 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
