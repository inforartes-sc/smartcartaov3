import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Home, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Mail, 
  MessageSquare, 
  MapPin, 
  ShieldCheck, 
  Loader2,
  Phone,
  Layout,
  Users,
  Camera,
  Lock,
  Globe,
  Briefcase,
  Fingerprint
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const niche = searchParams.get('n') === 'realestate' ? 'realestate' : 'vehicle';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_whatsapp: '',
    client_document: '',
    role_title: '',
    suggested_username: '',
    suggested_password: '',
    business_name: '',
    business_location: '',
    setup_type: 'self',
    product_estimated_count: '1-5',
    additional_notes: '',
    client_logo_url: '',
    niche: niche
  });

  const isRealEstate = niche === 'realestate';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande (Máx 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData({ ...formData, client_logo_url: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/public/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
        setStep(3);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erro ao enviar formulário');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo/Brand Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4">
            <Layout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-center mb-2">
            Smart <span className="text-blue-500">Cartão</span>
          </h1>
          <div className="h-1 w-12 bg-blue-500 rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/5 backdrop-blur-2xl p-10 lg:p-14 rounded-[3rem] border border-white/10 shadow-3xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
              
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce transition-all">
                {isRealEstate ? (
                  <Home className="w-10 h-10 text-blue-500" />
                ) : (
                  <Car className="w-10 h-10 text-blue-500" />
                )}
              </div>
              <h2 className="text-3xl font-black mb-6 tracking-tight">Vamos começar seu <br /> sucesso digital?</h2>
              <p className="text-gray-400 leading-relaxed max-w-sm mx-auto mb-10 font-medium">
                Siga este breve onboarding para configurarmos sua plataforma profissional {isRealEstate ? 'imobiliária' : 'automotiva'}.
              </p>
              <button 
                onClick={() => setStep(2)}
                className="w-full py-5 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(37,99,235,0.3)] group uppercase tracking-widest text-xs"
              >
                Iniciar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="bg-white/5 backdrop-blur-2xl p-8 lg:p-12 rounded-[3.5rem] border border-white/10 shadow-3xl overflow-y-auto max-h-[85vh] scrollbar-thin"
            >
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2 block">Cadastro Completo</span>
                  <h2 className="text-3xl font-black tracking-tight">Informações Pessoais</h2>
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-blue-500 font-black">
                  1/1
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Logo Upload Section */}
                <div className="flex flex-col items-center p-6 bg-white/5 border border-dashed border-white/20 rounded-[2.5rem] relative group hover:border-blue-500 transition-all">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white/10 group-hover:border-blue-500/50 bg-black/40 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-white/30" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-xs font-black uppercase text-blue-500 tracking-widest hover:text-blue-400">Inserir Logotipo</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">Imagem Recomendada: Quadrada (Ex: 512x512)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <User className="w-3.5 h-3.5 text-blue-500" /> Nome Completo
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="Como deseja ser chamado?"
                      value={formData.client_name}
                      onChange={e => setFormData({...formData, client_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Fingerprint className="w-3.5 h-3.5 text-blue-500" /> CPF / CNPJ
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="Doc. para o sistema"
                      value={formData.client_document}
                      onChange={e => setFormData({...formData, client_document: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5 mt-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Globe className="w-3.5 h-3.5 text-blue-500" /> Link Desejado (Slug)
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: nova.era.veiculos"
                      value={formData.suggested_username}
                      onChange={e => setFormData({...formData, suggested_username: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Mail className="w-3.5 h-3.5 text-blue-500" /> E-mail de Contato
                    </label>
                    <input 
                      required
                      type="email" 
                      placeholder="email@exemplo.com"
                      value={formData.client_email}
                      onChange={e => setFormData({...formData, client_email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Phone className="w-3.5 h-3.5 text-blue-500" /> WhatsApp
                    </label>
                    <input 
                      required
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      value={formData.client_whatsapp}
                      onChange={e => setFormData({...formData, client_whatsapp: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Lock className="w-3.5 h-3.5 text-blue-500" /> Sugestão de Senha
                    </label>
                    <input 
                      required
                      type="password" 
                      placeholder="Sua senha inicial"
                      value={formData.suggested_password}
                      onChange={e => setFormData({...formData, suggested_password: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5 mt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Layout className="w-3.5 h-3.5 text-blue-500" /> Nome da Empresa
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder={isRealEstate ? "Ex: Imobiliária Prática" : "Ex: Top Veículos"}
                      value={formData.business_name}
                      onChange={e => setFormData({...formData, business_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Seu Cargo / Função
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="Consultor, Diretor, etc."
                      value={formData.role_title}
                      onChange={e => setFormData({...formData, role_title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Método de Cadastro</label>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, setup_type: 'self'})}
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all text-left ${
                          formData.setup_type === 'self' 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        Eu mesmo cadastro
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, setup_type: 'admin'})}
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all text-left ${
                          formData.setup_type === 'admin' 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        Quero que vocês cadastrem
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">Volume de {isRealEstate ? 'Imóveis' : 'Veículos'}</label>
                    <div className="relative group">
                        <select 
                        value={formData.product_estimated_count}
                        onChange={e => setFormData({...formData, product_estimated_count: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all appearance-none font-bold text-sm"
                        >
                        <option value="1-5" className="bg-[#1a1a1a]">1 a 5 unidades</option>
                        <option value="5-10" className="bg-[#1a1a1a]">5 a 10 unidades</option>
                        <option value="10-20" className="bg-[#1a1a1a]">10 a 20 unidades</option>
                        <option value="20+" className="bg-[#1a1a1a]">Mais de 20 unidades</option>
                        </select>
                        <Layout className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2 flex items-center gap-2 tracking-widest">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Observações Importantes
                  </label>
                  <textarea 
                    placeholder="Se algum dado ficou de fora, nos conte aqui..."
                    value={formData.additional_notes}
                    onChange={e => setFormData({...formData, additional_notes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-4 focus:ring-blue-500/20 outline-none h-24 resize-none transition-all font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 px-8 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(37,99,235,0.3)] text-xs uppercase tracking-widest mt-6 active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Finalizar e Enviar Onboarding
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-2xl p-12 lg:p-20 rounded-[4rem] border border-white/10 shadow-3xl text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-600/5 rounded-[4rem] animate-pulse" />
              
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-10 relative z-10 transition-transform hover:rotate-12 duration-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-4xl font-black mb-6 relative z-10 tracking-tight">Perfeito, <br /> recebemos tudo!</h2>
              <p className="text-gray-400 leading-relaxed mb-10 text-lg relative z-10 font-medium">
                Sua solicitação de ativação já está na fila. <br /> Nosso time entrará em contato em breve.
              </p>
              
              <div className="pt-8 border-t border-white/10 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">Protocolo Digital</span>
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{Date.now().toString(36).toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Info */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-10 text-gray-700 text-[10px] font-black uppercase tracking-[0.3em] z-10"
      >
        © 2026 Smart Cartão • Secured by Advanced AI
      </motion.p>
    </div>
  );
}
