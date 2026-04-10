import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Loader2, 
  Layout, 
  Type, 
  MousePointer2, 
  CheckCircle2, 
  List, 
  Zap, 
  MessageCircle, 
  HelpCircle,
  Megaphone,
  Sparkles,
  Layers,
  Star,
  Camera,
  Trash2,
  Image as ImageIcon,
  Smartphone,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../lib/supabase';

export default function MasterLanding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('hero');
  
  const [settings, setSettings] = useState({
    landing_hero_title: 'REVOLUCIONE SUAS VENDAS',
    landing_hero_subtitle: 'Essa é a ferramenta definitiva que os grandes vendedores usam para dominar o mercado digital.',
    landing_hero_cta: 'Começar Agora',
    landing_stats_text: '+425 Clientes Satisfeitos',
    landing_stats_description: 'Nossa plataforma é referência em inovação e resultados reais no mercado digital.',
    
    landing_concept_title: 'MUITO MAIS QUE UM SIMPLES LINK.',
    landing_concept_subtitle: 'É sua identidade profissional completa no bolso do seu cliente.',
    landing_concept_item1_t: '100% Personalizado',
    landing_concept_item1_d: 'Sua logo, suas cores, suas fotos. Nada de layouts genéricos.',
    landing_concept_item2_t: 'Lead Direto no WhatsApp',
    landing_concept_item2_d: 'Sem carrinhos complexos. O cliente clica e já está falando com você.',
    landing_concept_item3_t: 'Atualizações Ilimitadas',
    landing_concept_item3_d: 'Mudou o produto? Atualize em 1 minuto e todos vêem na hora.',
    
    landing_features_title: 'PODER PARA VENDER',

    landing_done_tag: 'VOCÊ NÃO PRECISA SABER EDITAR!',
    landing_done_title_first: 'NÓS MONTAMOS',
    landing_done_title_last: 'TUDO POR VOCÊ!',
    landing_done_text: 'Não esquente a cabeça com configurações difíceis. Nossa equipe especialista vai arregaçar as mangas e fazer todo o seu Cartão Digital: desde a estrutura até o cadastro dos seus contatos e produtos. Você só precisa nos enviar as informações e nós entregamos seu material pronto para uso!',
     
    landing_catalog_tag: 'RECURSOS EXCLUSIVOS',
    landing_catalog_title_first: 'O PODER DO SEU',
    landing_catalog_title_last: 'CATÁLOGO DIGITAL',
    landing_catalog_text: 'Construído para maximizar seus resultados. Uma experiência fluida que guia seu cliente até o fechamento da venda, sem distrações.',
    landing_catalog_btn_text: 'VER NA PRÁTICA',
    landing_catalog_btn_link: '',
    landing_catalog_btn_link_auto: '',
    landing_catalog_btn_link_real: '',
    
    landing_cta_title: 'PRONTO PARA SER REFERÊNCIA?',
    landing_cta_subtitle: 'Você está a 5 minutos de ter uma presença digital que vende por você 24 horas por dia.',
    landing_cta_button: 'CRIAR MEU CATÁLOGO AGORA',

    landing_example1: '',
    landing_example2: '',
    landing_example3: '',
    landing_example4: '',
    landing_mockup_hero: '',
    landing_mockup_service: '',
    landing_mockup_features: '',
    landing_faqs: '',
    landing_features_json: ''
  });

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', content: '', rating: 5 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/testimonials');
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.content) return;
    
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTestimonial)
      });
      
      if (res.ok) {
        setNewTestimonial({ name: '', content: '', rating: 5 });
        fetchTestimonials();
        toast.success('Depoimento adicionado!');
      }
    } catch (err) {
      toast.error('Erro ao adicionar depoimento');
    }
  };

  const handleDeleteTestimonial = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (res.ok) {
        fetchTestimonials();
        toast.success('Depoimento removido!');
        setConfirmDeleteId(null);
      }
    } catch (err) {
      toast.error('Erro ao remover depoimento');
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/settings?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        // Force strings to be at least empty strings to avoid null issues in controlled inputs
        const normalizedData = { ...data };
        Object.keys(normalizedData).forEach(key => {
          if (normalizedData[key] === null) normalizedData[key] = '';
        });
        setSettings(prev => ({ ...prev, ...normalizedData }));
      }
    } catch (err) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(field);
      const file = e.target.files[0];
      const url = await uploadImage(file);
      setSettings(prev => ({ ...prev, [field]: url }));
      toast.success('Imagem enviada com sucesso!');
    } catch (err: any) {
      toast.error(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success('Landing Page atualizada com sucesso!');
        fetchSettings(); // Refresh to ensure synchronization
      } else {
        toast.error('Erro ao salvar no servidor');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center gap-4 text-blue-600 font-black animate-pulse">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      CARREGANDO EDITOR...
    </div>
  );

  const tabs = [
    { id: 'hero', name: 'Hero', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'concept', name: 'Conceito', icon: <Layers className="w-4 h-4" /> },
    { id: 'models', name: 'Modelos (4)', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'screens', name: 'Telões', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'features', name: 'Recursos', icon: <Zap className="w-4 h-4" /> },
    { id: 'service', name: 'Seção "Vermelha"', icon: <List className="w-4 h-4" /> },
    { id: 'catalog', name: 'Seção "Azul"', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'authority', name: 'Autoridade', icon: <Star className="w-4 h-4" /> },
    { id: 'faq', name: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'cta', name: 'CTA Final', icon: <Megaphone className="w-4 h-4" /> }
  ];

  return (
    <div className="max-w-5xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
             EDITOR <span className="text-blue-600 not-italic">DA LANDING</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sua vitrine profissional sob controle total</p>
        </div>

        <div className="flex flex-wrap bg-gray-100 p-1 rounded-2xl gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-8">
          
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">Hero Section</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Primeira Impressão</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 pl-1">Título H1</label>
                  <textarea
                    value={settings.landing_hero_title}
                    onChange={(e) => setSettings({ ...settings, landing_hero_title: e.target.value })}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-blue-100 font-black uppercase italic min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 pl-1">Subtítulo</label>
                  <textarea
                    value={settings.landing_hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, landing_hero_subtitle: e.target.value })}
                    className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-blue-100 font-medium min-h-[100px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Botão Principal</label>
                    <input type="text" value={settings.landing_hero_cta} onChange={(e) => setSettings({ ...settings, landing_hero_cta: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Prova Social</label>
                    <input type="text" value={settings.landing_stats_text} onChange={(e) => setSettings({ ...settings, landing_stats_text: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'concept' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">Conceito</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Explicação do produto</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Título da Seção</label>
                      <input type="text" value={settings.landing_concept_title} onChange={(e) => setSettings({ ...settings, landing_concept_title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Subtítulo</label>
                      <input type="text" value={settings.landing_concept_subtitle} onChange={(e) => setSettings({ ...settings, landing_concept_subtitle: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                   </div>
                 </div>

                 {[1, 2, 3].map(i => (
                   <div key={i} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">Título Item {i}</label>
                        <input type="text" value={(settings as any)[`landing_concept_item${i}_t`]} onChange={(e) => setSettings({ ...settings, [`landing_concept_item${i}_t`]: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-gray-400">Descrição Item {i}</label>
                        <input type="text" value={(settings as any)[`landing_concept_item${i}_d`]} onChange={(e) => setSettings({ ...settings, [`landing_concept_item${i}_d`]: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs" />
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">Modelos de Exemplo</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">As 4 imagens da grade lateral</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Modelo {i}</label>
                    <div className="relative h-64 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
                       {(settings as any)[`landing_example${i}`] ? (
                         <img src={(settings as any)[`landing_example${i}`]} className="w-full h-full object-cover" alt={`Model ${i}`} />
                       ) : (
                         <div className="text-center text-gray-300">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-[10px] uppercase font-black tracking-widest">Sem Imagem</p>
                         </div>
                       )}
                       
                       <label className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300 backdrop-blur-sm">
                          {uploading === `landing_example${i}` ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 mb-2" />
                              <span className="font-black text-xs uppercase tracking-widest">Enviar Imagem</span>
                            </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, `landing_example${i}`)} disabled={uploading !== null} />
                       </label>

                       {(settings as any)[`landing_example${i}`] && (
                         <button 
                           type="button"
                           onClick={() => setSettings({...settings, [`landing_example${i}`]: ''})} 
                           className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'screens' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">Telas dos Mockups</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Personalize a imagem que aparece dentro do celular inserido nas novas divisões</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Hero Mockup */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Página Inicial (Hero)</label>
                  <div className="relative h-96 w-full max-w-[200px] bg-gray-50 rounded-[2.5rem] border-4 border-slate-900 flex flex-col items-center justify-center overflow-hidden group mx-auto shadow-xl">
                     <div className="absolute top-0 w-24 h-5 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                     
                     {settings.landing_mockup_hero ? (
                       <img src={settings.landing_mockup_hero} className="w-full h-full object-cover object-top" alt={`Mockup Hero`} />
                     ) : (
                       <div className="text-center text-gray-300 px-4">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] uppercase font-black tracking-widest leading-tight">Mockup Padrão CSS</p>
                       </div>
                     )}
                     
                     <label className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300 backdrop-blur-sm z-30">
                        {uploading === `landing_mockup_hero` ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="font-black text-[10px] uppercase tracking-widest text-center px-4">Subir Print da Tela</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, `landing_mockup_hero`)} disabled={uploading !== null} />
                     </label>

                     {settings.landing_mockup_hero && (
                       <button 
                         type="button"
                         onClick={() => setSettings({...settings, landing_mockup_hero: ''})} 
                         className="absolute top-6 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-40"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Celular: Serviço (Vermelho)</label>
                  <div className="relative h-96 w-[200px] bg-gray-50 rounded-[2.5rem] border-4 border-slate-900 flex flex-col items-center justify-center overflow-hidden group mx-auto shadow-xl">
                     <div className="absolute top-0 w-24 h-5 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                     
                     {settings.landing_mockup_service ? (
                       <img src={settings.landing_mockup_service} className="w-full h-full object-cover object-top" alt={`Mockup Service`} />
                     ) : (
                       <div className="text-center text-gray-300 px-4">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] uppercase font-black tracking-widest leading-tight">Mockup Padrão CSS</p>
                       </div>
                     )}
                     
                     <label className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300 backdrop-blur-sm z-30">
                        {uploading === `landing_mockup_service` ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="font-black text-[10px] uppercase tracking-widest text-center px-4">Subir Print da Tela</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, `landing_mockup_service`)} disabled={uploading !== null} />
                     </label>

                     {settings.landing_mockup_service && (
                       <button 
                         type="button"
                         onClick={() => setSettings({...settings, landing_mockup_service: ''})} 
                         className="absolute top-6 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-40"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Celular: Recursos (Azul)</label>
                  <div className="relative h-96 w-[200px] bg-gray-50 rounded-[2.5rem] border-4 border-slate-900 flex flex-col items-center justify-center overflow-hidden group mx-auto shadow-xl">
                     <div className="absolute top-0 w-24 h-5 bg-slate-900 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                     
                     {settings.landing_mockup_features ? (
                       <img src={settings.landing_mockup_features} className="w-full h-full object-cover object-top" alt={`Mockup Features`} />
                     ) : (
                       <div className="text-center text-gray-300 px-4">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-[10px] uppercase font-black tracking-widest leading-tight">Mockup Padrão CSS</p>
                       </div>
                     )}
                     
                     <label className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300 backdrop-blur-sm z-30">
                        {uploading === `landing_mockup_features` ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <>
                            <Camera className="w-8 h-8 mb-2" />
                            <span className="font-black text-[10px] uppercase tracking-widest text-center px-4">Subir Print da Tela</span>
                          </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, `landing_mockup_features`)} disabled={uploading !== null} />
                     </label>

                     {settings.landing_mockup_features && (
                       <button 
                         type="button"
                         onClick={() => setSettings({...settings, landing_mockup_features: ''})} 
                         className="absolute top-6 right-4 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-40"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                 <div className="p-3 bg-blue-600 rounded-2xl text-white">
                   <Zap className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-gray-800 uppercase italic">Grid de Recursos</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Edite os 6 cards de funcionalidades</p>
                 </div>
               </div>

               <div className="space-y-8">
                 <div className="space-y-2 max-w-md">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Título da Seção</label>
                    <input type="text" value={settings.landing_features_title} onChange={(e) => setSettings({ ...settings, landing_features_title: e.target.value })} className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-blue-100 font-black uppercase italic" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(() => {
                      let featuresList = [];
                      try {
                        featuresList = typeof settings.landing_features_json === 'string' 
                          ? JSON.parse(settings.landing_features_json || '[]')
                          : settings.landing_features_json || [];
                      } catch (e) { featuresList = []; }

                      if (featuresList.length === 0) {
                         featuresList = [
                            { id: 'f1', icon: 'LayoutTemplate', title: "Catálogo Profissional", description: "Organize seus produtos por categorias, marcas e anos com filtros inteligentes.", color: "bg-blue-500" },
                            { id: 'f2', icon: 'MessageCircle', title: "Vendas no WhatsApp", description: "Seus clientes escolhem os produtos e enviam o carrinho direto para o seu WhatsApp.", color: "bg-green-500" },
                            { id: 'f3', icon: 'TrendingUp', title: "Aumento de Conversão", description: "Interface intuitiva e rápida que elimina a indecisão e acelera o fechamento.", color: "bg-red-500" },
                            { id: 'f4', icon: 'Smartphone', title: "App no Celular", description: "Pode ser 'instalado' como um aplicativo (PWA) na tela inicial do seu cliente.", color: "bg-purple-500" },
                            { id: 'f5', icon: 'BarChart3', title: "Métricas Reais", description: "Saiba quais produtos são mais vistos e entenda o comportamento da sua audiência.", color: "bg-slate-800" },
                            { id: 'f6', icon: 'Globe', title: "Links Personalizados", description: "Adicione suas redes sociais, sites e contatos em um só lugar de forma estratégica e profissional.", color: "bg-indigo-600" }
                         ];
                      }

                      const iconOptions = ['LayoutTemplate', 'MessageCircle', 'TrendingUp', 'Smartphone', 'BarChart3', 'Globe', 'ShieldCheck', 'Zap', 'Star'];

                      return featuresList.map((f: any, i: number) => (
                        <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-4 relative group">
                           <div className="flex items-center gap-4 mb-4">
                              <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                                 <Plus className="w-6 h-6" /> {/* Generic since dynamic icons as components in state is hard */}
                              </div>
                              <div className="flex-grow">
                                 <label className="text-[9px] font-black uppercase text-gray-400">Ícone</label>
                                 <select 
                                   value={f.icon}
                                   onChange={(e) => {
                                      const nf = [...featuresList];
                                      nf[i].icon = e.target.value;
                                      setSettings({...settings, landing_features_json: JSON.stringify(nf)});
                                   }}
                                   className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                                 >
                                    {iconOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-gray-400">Título</label>
                              <input 
                                type="text" 
                                value={f.title}
                                onChange={(e) => {
                                  const nf = [...featuresList];
                                  nf[i].title = e.target.value;
                                  setSettings({...settings, landing_features_json: JSON.stringify(nf)});
                                }}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-black uppercase"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase text-gray-400">Descrição</label>
                              <textarea 
                                rows={2}
                                value={f.description}
                                onChange={(e) => {
                                  const nf = [...featuresList];
                                  nf[i].description = e.target.value;
                                  setSettings({...settings, landing_features_json: JSON.stringify(nf)});
                                }}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[11px] font-medium resize-none"
                              />
                           </div>
                        </div>
                      ));
                    })()}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'service' && (
             <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                 <div className="p-3 bg-red-600 rounded-2xl text-white">
                   <List className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-gray-800 uppercase italic">Serviço de Montagem</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Seção de entrega rápida do cartão</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Etiqueta Superior</label>
                    <input type="text" value={settings.landing_done_tag} onChange={(e) => setSettings({ ...settings, landing_done_tag: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs font-black uppercase" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Início do Título (Branco)</label>
                       <input type="text" value={settings.landing_done_title_first} onChange={(e) => setSettings({ ...settings, landing_done_title_first: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Fim do Título (Vermelho Escuro)</label>
                       <input type="text" value={settings.landing_done_title_last} onChange={(e) => setSettings({ ...settings, landing_done_title_last: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Texto Descritivo</label>
                    <textarea value={settings.landing_done_text} onChange={(e) => setSettings({ ...settings, landing_done_text: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium min-h-[100px] resize-none" />
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'catalog' && (
             <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                 <div className="p-3 bg-blue-600 rounded-2xl text-white">
                   <MousePointer2 className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-gray-800 uppercase italic">O Poder do Catálogo</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Seção de demonstração do catálogo / Recursos Secundários</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Etiqueta Superior</label>
                    <input type="text" value={settings.landing_catalog_tag} onChange={(e) => setSettings({ ...settings, landing_catalog_tag: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.5rem] text-xs font-black uppercase" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Início do Título (Branco)</label>
                       <input type="text" value={settings.landing_catalog_title_first} onChange={(e) => setSettings({ ...settings, landing_catalog_title_first: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Fim do Título (Azul)</label>
                       <input type="text" value={settings.landing_catalog_title_last} onChange={(e) => setSettings({ ...settings, landing_catalog_title_last: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Texto Descritivo</label>
                    <textarea value={settings.landing_catalog_text} onChange={(e) => setSettings({ ...settings, landing_catalog_text: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium min-h-[100px] resize-none" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Título Centralizador (ex: VER NA PRÁTICA)</label>
                       <input type="text" value={settings.landing_catalog_btn_text} onChange={(e) => setSettings({ ...settings, landing_catalog_btn_text: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-blue-100 rounded-2xl text-xs font-black text-center uppercase" placeholder="VER NA PRÁTICA" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest pl-1">Link Modelo Automotivo</label>
                       <input type="text" value={settings.landing_catalog_btn_link_auto} onChange={(e) => setSettings({ ...settings, landing_catalog_btn_link_auto: e.target.value })} className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-medium" placeholder="Ex: https://smartcartao.com.br/veiculos" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest pl-1">Link Modelo Imobiliário</label>
                       <input type="text" value={settings.landing_catalog_btn_link_real} onChange={(e) => setSettings({ ...settings, landing_catalog_btn_link_real: e.target.value })} className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-medium" placeholder="Ex: https://smartcartao.com.br/imoveis" />
                    </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'authority' && (
             <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                 <div className="p-3 bg-amber-500 rounded-2xl text-white">
                   <Star className="w-6 h-6" />
                 </div>
                 <div>
                   <h2 className="text-xl font-black text-gray-800 uppercase italic">Autoridade e Prova Social</h2>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Configure o bloco de "Clientes Satisfeitos"</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Título Grande (ex: +425 Clientes Satisfeitos)</label>
                    <input type="text" value={settings.landing_stats_text} onChange={(e) => setSettings({ ...settings, landing_stats_text: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Descrição de Confiança</label>
                    <textarea value={settings.landing_stats_description} onChange={(e) => setSettings({ ...settings, landing_stats_description: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-medium min-h-[100px] resize-none" />
                 </div>

                 <div className="pt-10 border-t border-gray-50 mt-10">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black text-gray-800 uppercase italic">Gerenciar Depoimentos</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Adicione ou remova relatos reais</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {testimonials.length} ATIVOS
                      </div>
                   </div>

                   {/* Add Testimonial Form */}
                   <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-tighter pl-1">Nome do Cliente</label>
                            <input 
                               type="text" 
                               value={newTestimonial.name} 
                               onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                               className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold" 
                               placeholder="Ex: Pedro Henrique"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-gray-400 tracking-tighter pl-1">Avaliação (1 a 5)</label>
                            <select 
                               value={newTestimonial.rating}
                               onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                               className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                               {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} Estrelas</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-gray-400 tracking-tighter pl-1">Conteúdo do Relato</label>
                         <textarea 
                            value={newTestimonial.content}
                            onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium resize-none min-h-[80px]"
                            placeholder="Escreva o depoimento aqui..."
                         />
                      </div>
                      <button 
                         onClick={handleAddTestimonial}
                         className="w-full py-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                         Adicionar Novo Depoimento
                      </button>
                   </div>

                   {/* Testimonials List */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {testimonials.map((t) => (
                        <div key={t.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] relative group shadow-sm hover:shadow-md transition-all">
                           <div className="absolute top-4 right-4 flex gap-2">
                             {confirmDeleteId === t.id ? (
                               <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                  <button 
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:bg-slate-200"
                                  >
                                    Cancelar
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTestimonial(t.id)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-red-700 shadow-lg shadow-red-500/20"
                                  >
                                    Excluir
                                  </button>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setConfirmDeleteId(t.id)}
                                 className="p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                           <div className="flex gap-0.5 mb-2">
                              {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 text-amber-500 fill-current" />)}
                           </div>
                           <p className="text-[11px] text-gray-600 font-medium italic mb-4 line-clamp-3">"{t.content}"</p>
                           <h5 className="text-[10px] font-black text-gray-800 uppercase">{t.name}</h5>
                        </div>
                      ))}
                   </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'cta' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">CTA Final</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Fechamento de venda</p>
                </div>
              </div>
              <div className="space-y-6">
                <input type="text" value={settings.landing_cta_title} onChange={(e) => setSettings({ ...settings, landing_cta_title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black uppercase italic" placeholder="Título" />
                <textarea value={settings.landing_cta_subtitle} onChange={(e) => setSettings({ ...settings, landing_cta_subtitle: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm min-h-[100px]" placeholder="Descrição" />
                <input type="text" value={settings.landing_cta_button} onChange={(e) => setSettings({ ...settings, landing_cta_button: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase" placeholder="Texto Botão" />
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-800 uppercase italic">Perguntas Frequentes (FAQ)</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">As maiores objeções de venda resolvidas previamente</p>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  let faqList = [];
                  try {
                    faqList = JSON.parse(settings.landing_faqs || '[]');
                  } catch (e) {
                    faqList = [];
                  }
                  
                  if (faqList.length === 0) {
                     faqList = [
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
                  }

                  return (
                    <>
                      {faqList.map((item: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border-2 border-slate-100 relative group shadow-sm hover:border-blue-500/50 transition-colors">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 text-left">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Pergunta {i+1}</label>
                                 <input 
                                   type="text" 
                                   value={item.q}
                                   onChange={(e) => {
                                      const nf = [...faqList]; 
                                      nf[i].q = e.target.value; 
                                      setSettings({...settings, landing_faqs: JSON.stringify(nf)});
                                   }}
                                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-800 text-sm outline-none transition-all"
                                 />
                              </div>
                              <div className="space-y-2 text-left">
                                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-2">Resposta {i+1}</label>
                                 <textarea 
                                   rows={3}
                                   value={item.a}
                                   onChange={(e) => {
                                      const nf = [...faqList]; 
                                      nf[i].a = e.target.value; 
                                      setSettings({...settings, landing_faqs: JSON.stringify(nf)});
                                   }}
                                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium text-slate-500 resize-none outline-none transition-all"
                                 ></textarea>
                              </div>
                           </div>
                           <button 
                             onClick={(e) => {
                               e.preventDefault();
                               const nf = faqList.filter((_: any, idx: number) => idx !== i);
                               setSettings({...settings, landing_faqs: JSON.stringify(nf)});
                             }}
                             className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ))}

                      <button 
                         onClick={(e) => {
                            e.preventDefault();
                            const nf = [...faqList, {q: 'Nova Pergunta?', a: 'Resposta detalhada...'}];
                            setSettings({...settings, landing_faqs: JSON.stringify(nf)});
                         }}
                         className="w-full py-5 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer"
                      >
                         <Plus className="w-4 h-4" /> Adicionar Pergunta (FAQ)
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving || uploading !== null}
            className="px-16 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-xl"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Todas Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
