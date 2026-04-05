import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Layout, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Camera, 
  Fingerprint, 
  Globe, 
  Lock, 
  Briefcase, 
  Package, 
  MessageSquare,
  Home,
  MousePointer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  
  const queryParams = new URLSearchParams(window.location.search);
  const niche = queryParams.get('niche') || 'vehicle';
  const isRealEstate = niche === 'realestate';

  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_whatsapp: '',
    niche: niche,
    setup_type: 'self',
    product_estimated_count: '1-5',
    business_name: '',
    business_location: '',
    additional_notes: '',
    client_document: '',
    role_title: '',
    suggested_username: '',
    client_logo_url: '',
    suggested_password: ''
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => setSettings(d))
      .catch(() => {});
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setFormData(prev => ({ ...prev, client_logo_url: base64 }));
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
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success('Informações enviadas com sucesso!');
      } else {
        toast.error('Ocorreu um erro ao enviar. Tente novamente.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 relative overflow-hidden font-sans"
        style={{ backgroundImage: 'url("/login-bg.png")' }}
      >
        <div className="absolute inset-0 bg-slate-900/20"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/95 backdrop-blur-md p-12 rounded-[32px] border border-white/40 shadow-2xl relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo pronto!</h2>
          <p className="text-gray-600 mb-8 text-lg">Suas informações foram recebidas. Nossa equipe já está trabalhando na sua plataforma.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all"
          >
            Voltar para o site
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 md:p-10 relative overflow-hidden font-sans"
      style={{ backgroundImage: 'url("/login-bg.png")' }}
    >
      <div className="absolute inset-0 bg-slate-900/20"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[32px] border border-white/40 shadow-2xl relative z-10 overflow-hidden flex flex-col"
      >
        <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="text-center mb-10">
            {(settings?.footer_logo || settings?.default_logo) ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-6"
              >
                <img 
                  src={settings.footer_logo || settings.default_logo} 
                  alt="Logo" 
                  className="max-h-16 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                <Layout className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              {step === 1 ? 'Vamos começar seu sucesso digital?' : 'Últimos detalhes...'}
            </h1>
            <p className="text-gray-500 mt-4 text-lg">
              {step === 1 
                ? `Siga este breve onboarding para configurarmos sua plataforma profissional ${isRealEstate ? 'imobiliária' : 'automotiva'}.`
                : 'Configure as preferências para sua conta administrativa.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-10 text-blue-600">
                  {isRealEstate ? (
                    <Home className="w-12 h-12" />
                  ) : (
                    <Car className="w-12 h-12" />
                  )}
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20"
                >
                  Iniciar Agora
                  <ArrowRight className="w-6 h-6" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Section */}
                  <div className="flex flex-col items-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] relative group hover:border-blue-500 transition-all">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-white bg-white shadow-sm flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-xs font-bold uppercase text-blue-600 tracking-widest hover:text-blue-500">Enviar Logotipo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Nome Completo</label>
                      <input 
                        required
                        placeholder="Seu nome"
                        value={formData.client_name}
                        onChange={e => setFormData({...formData, client_name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">CPF / CNPJ</label>
                      <input 
                        required
                        placeholder="Seu documento"
                        value={formData.client_document}
                        onChange={e => setFormData({...formData, client_document: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Link Desejado (Slug)</label>
                      <input 
                        required
                        placeholder="Ex: nova.era.veiculos"
                        value={formData.suggested_username}
                        onChange={e => setFormData({...formData, suggested_username: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">E-mail</label>
                      <input 
                        required
                        type="email"
                        placeholder="email@exemplo.com"
                        value={formData.client_email}
                        onChange={e => setFormData({...formData, client_email: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">WhatsApp</label>
                      <input 
                        required
                        placeholder="(00) 00000-0000"
                        value={formData.client_whatsapp}
                        onChange={e => setFormData({...formData, client_whatsapp: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Sugestão de Senha</label>
                      <input 
                        type="password"
                        placeholder="Opcional"
                        value={formData.suggested_password}
                        onChange={e => setFormData({...formData, suggested_password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Método de Cadastro</label>
                       <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, setup_type: 'self'})}
                          className={`flex-1 p-4 rounded-2xl border transition-all text-xs font-bold ${
                            formData.setup_type === 'self' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Eu mesmo
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, setup_type: 'admin'})}
                          className={`flex-1 p-4 rounded-2xl border transition-all text-xs font-bold ${
                            formData.setup_type === 'admin' 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          Vocês
                        </button>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Volume Previsto</label>
                      <select 
                        value={formData.product_estimated_count}
                        onChange={e => setFormData({...formData, product_estimated_count: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-gray-900 font-medium appearance-none"
                      >
                        <option value="1-5">1 a 5 unidades</option>
                        <option value="5-10">5 a 10 unidades</option>
                        <option value="10-20">10 a 20 unidades</option>
                        <option value="20+">Mais de 20 unidades</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Observações</label>
                    <textarea 
                      placeholder="Algum outro detalhe..."
                      value={formData.additional_notes}
                      onChange={e => setFormData({...formData, additional_notes: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400 text-gray-900 min-h-[100px] resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : 'Finalizar Cadastro'}
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer minimal style */}
      <p className="mt-8 text-slate-500 text-xs font-semibold tracking-widest uppercase relative z-10">
        © 2026 SMART CARTÃO • SECURED BY ADVANCED AI
      </p>
    </div>
  );
}
