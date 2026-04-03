import React, { useState } from 'react';
import { Settings, Phone, Image as ImageIcon, Upload, Loader2, Save, Globe, Rocket } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../lib/supabase';

interface Props {
  globalSettings: any;
  setGlobalSettings: (s: any) => void;
  handleSaveSettings: () => void;
  savingSettings: boolean;
}

export default function MasterSettings({ globalSettings, setGlobalSettings, handleSaveSettings, savingSettings }: Props) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'default' | 'footer' | 'favicon' = 'default') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (type === 'favicon') setUploadingFavicon(true);
      else if (type === 'footer') setUploadingFooter(true); 
      else setUploadingLogo(true);
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/admin/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            if (type === 'favicon') setGlobalSettings({ ...globalSettings, favicon: data.url });
            else if (type === 'footer') setGlobalSettings({ ...globalSettings, footer_logo: data.url });
            else setGlobalSettings({ ...globalSettings, default_logo: data.url });
            toast.success('Imagem enviada com sucesso!');
          } else {
            const data = await res.json();
            toast.error(`Erro: ${data.error || 'Falha no servidor'}`);
          }
        } catch (err) {
          toast.error('Erro de conexão com o servidor');
        } finally {
          setUploadingLogo(false);
          setUploadingFooter(false);
          setUploadingFavicon(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Erro ao processar imagem');
      setUploadingLogo(false);
      setUploadingFooter(false);
      setUploadingFavicon(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight text-center md:text-left">Configurações Gerais</h1>
        <p className="text-xs text-gray-500 text-center md:text-left">Configure os padrões para novos usuários</p>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden max-w-4xl">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/20">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-gray-800 tracking-tight text-sm uppercase tracking-widest">Padrões do Sistema</h2>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-blue-500" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Logotipo Padrão
              </label>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {globalSettings.default_logo ? (
                  <img src={globalSettings.default_logo} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow w-full space-y-3">
                <input
                    type="text"
                    placeholder="URL da imagem..."
                    value={globalSettings.default_logo}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, default_logo: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-blue-700 transition-all uppercase tracking-widest flex items-center gap-2">
                      <Upload className="w-3 h-3" /> Enviar Logo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'default')} />
                    </label>
                    {globalSettings.default_logo && (
                        <button 
                            onClick={() => setGlobalSettings({ ...globalSettings, default_logo: '' })}
                            className="px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                            Excluir
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>
 
          <hr className="border-gray-50" />

          {/* Footer Logo Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-emerald-500" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Logotipo do Rodapé (Dashboard)
              </label>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {globalSettings.footer_logo ? (
                  <img src={globalSettings.footer_logo} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
                {uploadingFooter && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow w-full space-y-3">
                <input
                    type="text"
                    placeholder="URL da imagem (será exibida no rodapé do consultor)..."
                    value={globalSettings.footer_logo || ''}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, footer_logo: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium border-l-4 border-l-emerald-100"
                />
                <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-700 transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm shadow-emerald-100">
                      <Upload className="w-3 h-3" /> Enviar Logo
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'footer')} />
                    </label>
                    {globalSettings.footer_logo && (
                        <button 
                            onClick={() => setGlobalSettings({ ...globalSettings, footer_logo: '' })}
                            className="px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                            Excluir
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* Favicon Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-amber-500" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Favicon (Ícone do Navegador)
              </label>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {globalSettings.favicon ? (
                  <img src={globalSettings.favicon} className="w-full h-full object-contain" />
                ) : (
                  <Globe className="w-5 h-5 text-gray-300" />
                )}
                {uploadingFavicon && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex-grow w-full space-y-3">
                <input
                    type="text"
                    placeholder="URL do ícone (.ico, .png, .svg)..."
                    value={globalSettings.favicon || ''}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, favicon: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium border-l-4 border-l-amber-100"
                />
                <div className="flex items-center gap-2">
                    <label className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black cursor-pointer hover:bg-amber-600 transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm shadow-amber-100">
                      <Upload className="w-3 h-3" /> Enviar Favicon
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'favicon')} />
                    </label>
                    {globalSettings.favicon && (
                        <button 
                            onClick={() => setGlobalSettings({ ...globalSettings, favicon: '' })}
                            className="px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                            Excluir
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* Phone Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 text-emerald-500" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                WhatsApp Padrão
              </label>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Ex: 5592984488888"
                value={globalSettings.default_phone || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, default_phone: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium border-l-4 border-l-emerald-100"
              />
              <p className="text-[10px] text-gray-400 italic pl-1">Número inicial para novos consultores.</p>
            </div>
          </div>

          <hr className="border-gray-50" />

          {/* Global Footer Text Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-500" />
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Texto do Rodapé Global (Copyright/Créditos)
                </label>
            </div>
            <textarea
                value={globalSettings.footer_text || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, footer_text: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium min-h-[80px] resize-none"
                placeholder="Ex: © 2026 Smart Cartão - Todos os direitos reservados."
            />
            <p className="text-[10px] text-gray-400 italic pl-1">Este texto aparecerá no final de todos os cartões e catálogos.</p>
          </div>

          <hr className="border-gray-50" />

          {/* System Version Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Settings className="w-3 h-3 text-slate-500" />
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Versão do Sistema
                </label>
            </div>
            <input
                type="text"
                value={globalSettings.system_version || ''}
                onChange={(e) => setGlobalSettings({ ...globalSettings, system_version: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-500 transition-all font-mono"
                placeholder="Ex: V2.0.4"
            />
          </div>

          <hr className="border-gray-50" />
          
          {/* Integration Test Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Rocket className="w-3 h-3 text-violet-500" />
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Integração com PagiXyPay / SaaSFinFlow
                </label>
            </div>
            
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-violet-900 uppercase tracking-tight">Teste de Conexão</h4>
                  <p className="text-[10px] text-violet-600 font-medium">Verifique se o seu sistema de faturamento está recebendo dados corretamente.</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      toast.loading('Testando conexão...', { id: 'test-api' });
                      const res = await fetch('/api/admin/test-integration', { method: 'POST' });
                      const data = await res.json();
                      toast.dismiss('test-api');
                      
                      if (data.ok) {
                        toast.success('Conexão estabelecida com sucesso!');
                      } else {
                        toast.error(`Falha na conexão (Status ${data.status})`);
                      }
                      
                      // Show detailed result in a specialized toast or alert
                      console.log('[TEST-INTEGRATION] Result:', data);
                      alert(`URL: ${data.url}\nStatus: ${data.status} ${data.statusText}\nResposta: ${typeof data.body === 'object' ? JSON.stringify(data.body) : data.body.substring(0, 500)}`);
                    } catch (err) {
                      toast.dismiss('test-api');
                      toast.error('Erro ao tentar testar a conexão');
                    }
                  }}
                  className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-[10px] font-black hover:bg-violet-700 transition-all shadow-md shadow-violet-200 uppercase tracking-widest flex items-center gap-2 shrink-0"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  Testar Conexão
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-50" />

          <div className="flex justify-start pt-4">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 uppercase tracking-widest flex items-center gap-2"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
