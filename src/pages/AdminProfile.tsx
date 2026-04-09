import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Camera, Plus, Trash2, Globe, Youtube, Instagram as InstaIcon, Facebook as FBIcon, Twitter, Music, Mail, Phone, Linkedin, Map, Key, Eye, EyeOff } from 'lucide-react';
import { uploadImage } from '../lib/supabase';

interface AdminProfileProps {
  user: any;
  onUpdate: (user: any) => void;
}

const ICON_OPTIONS = [
  { id: 'globe', label: 'Site/Geral', icon: Globe },
  { id: 'instagram', label: 'Instagram', icon: InstaIcon },
  { id: 'facebook', label: 'Facebook', icon: FBIcon },
  { id: 'youtube', label: 'Youtube', icon: Youtube },
  { id: 'tiktok', label: 'TikTok', icon: Music },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'mail', label: 'E-mail', icon: Mail },
  { id: 'phone', label: 'Telefone', icon: Phone },
  { id: 'map', label: 'Endereço/Mapa', icon: Map },
];

export default function AdminProfile({ user, onUpdate }: AdminProfileProps) {
  const [formData, setFormData] = useState({
    ...user,
    social_links: typeof user.social_links === 'string' ? JSON.parse(user.social_links) : (user.social_links || []),
    show_marquee: user.show_marquee !== undefined ? !!user.show_marquee : true,
    marquee_speed: user.marquee_speed || 20,
    show_catalog_banner: user.show_catalog_banner !== undefined ? !!user.show_catalog_banner : false,
    show_profile_banner: user.show_profile_banner !== undefined ? !!user.show_profile_banner : false,
    profile_banner_image: user.profile_banner_image || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const addSocialLink = () => {
    const newList = [...formData.social_links, { label: '', url: '', icon: 'globe' }];
    setFormData({ ...formData, social_links: newList });
  };

  const removeSocialLink = (index: number) => {
    const newList = [...formData.social_links];
    newList.splice(index, 1);
    setFormData({ ...formData, social_links: newList });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newList = [...formData.social_links];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, social_links: newList });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profile_image' | 'card_bottom_image' | 'card_background_image' | 'profile_banner_image' = 'profile_image') => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const url = await uploadImage(file);
      setFormData({ ...formData, [field]: url });
      toast.success('Imagem enviada com sucesso!');
    } catch (err: any) {
      toast.error(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        onUpdate(formData);
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar perfil.');
      }
    } catch (err) {
      toast.error('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error('As senhas não coincidem!');
      return;
    }
    if (passwordForm.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setPassLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password }),
      });
      if (res.ok) {
        toast.success('Senha alterada com sucesso!');
        setPasswordForm({ password: '', confirm: '' });
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          toast.error(`Erro: ${data.error || 'Não foi possível alterar a senha.'}`);
        } catch (e) {
          toast.error(`Erro no Servidor (${res.status})`);
        }
      }
    } catch (err: any) {
      toast.error(`Erro de conexão: ${err.message}`);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="w-full pb-8">
      <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mb-8 uppercase tracking-tight">Editar Perfil</h1>

      <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-3xl lg:rounded-[2rem] shadow-sm border border-gray-100 space-y-6 lg:space-y-8">
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <img
              src={formData.profile_image || "https://via.placeholder.com/150"}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
              alt="Profile"
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="w-8 h-8" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">{uploading ? 'Enviando...' : 'Clique para alterar a foto'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Exibição</label>
            <input
              type="text"
              value={formData.display_name || ''}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-4 py-2 border border-blue-50 bg-blue-50/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estabelecimento</label>
            <input
              type="text"
              value={formData.establishment || ''}
              onChange={(e) => setFormData({ ...formData, establishment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50/30 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Yamaha Motos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo/Título</label>
            <input
              type="text"
              value={formData.role_title || ''}
              onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-100 bg-gray-50/30 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área de Atuação</label>
            <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-600">
              {formData.niche === 'realestate' ? '🏠 Mercado Imobiliário' : '🚗 Revenda de Veículos'}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL da Foto de Perfil (Opcional)</label>
          <input
            type="text"
            value={formData.profile_image || ''}
            onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="https://exemplo.com/foto.png"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900">Links Sociais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (com DDD)</label>
             <input
               type="text"
               value={formData.whatsapp}
               onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
               className="w-full h-12 px-4 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
               placeholder="5599999999999"
             />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram (URL)</label>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full h-12 px-4 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://instagram.com/usuario"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (URL)</label>
            <input
              type="text"
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              className="w-full h-12 px-4 border border-gray-100 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://facebook.com/usuario"
            />
          </div>
        </div>
        </div>

        {/* Dynamic Social Links */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Links Adicionais</h3>
            <button
              type="button"
              onClick={addSocialLink}
              className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Link
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.social_links.map((link: any, index: number) => {
              const SelectedIcon = ICON_OPTIONS.find(i => i.id === link.icon)?.icon || Globe;
              return (
                <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative group/icon">
                    <select
                      value={link.icon || 'globe'}
                      onChange={(e) => updateSocialLink(index, 'icon', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 group-hover/icon:bg-blue-100 transition-colors">
                      <SelectedIcon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Ex: Meu Portfólio"
                      value={link.label}
                      onChange={(e) => updateSocialLink(index, 'label', e.target.value)}
                      className="w-full h-11 px-4 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      placeholder="URL (https://...)"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="w-full h-11 px-4 border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(index)}
                    className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
            {formData.social_links.length === 0 && (
              <p className="text-center text-xs text-gray-400 py-4 italic">Nenhum link adicional definido.</p>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900">Customização do Cartão</h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            {/* Imagem do Rodapé */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem do Rodapé</label>
              <div className="relative h-40 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center overflow-hidden group shadow-inner">
                {formData.card_bottom_image ? (
                  <img src={formData.card_bottom_image} className="w-full h-full object-contain p-4" alt="Footer" />
                ) : (
                  <img 
                    src={formData.niche === 'realestate' ? "/defaults/realestate.png" : "https://omeucartao.com.br/wp-content/uploads/2025/02/17.png"} 
                    className="w-full h-full object-contain p-4 opacity-30 grayscale" 
                    alt="Default" 
                  />
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                  <span className="bg-white/20 px-4 py-2 rounded-full font-bold text-[10px] backdrop-blur-md">Alterar</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'card_bottom_image')} />
                </label>
              </div>
            </div>

            {/* Banner Catálogo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Banner Catálogo</label>
                <input
                  type="checkbox"
                  checked={formData.show_catalog_banner}
                  onChange={(e) => setFormData({ ...formData, show_catalog_banner: e.target.checked })}
                  className="w-8 h-4 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 transition-all cursor-pointer relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all shadow-inner"
                />
              </div>
              <div className="relative h-40 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center overflow-hidden group shadow-inner">
                {formData.card_background_image ? (
                  <img src={formData.card_background_image} className="w-full h-full object-contain p-4" alt="Catalog Banner" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Plus className="w-8 h-8 mx-auto mb-1 opacity-20" />
                    <p className="text-[10px]">Adicionar Banner</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                  <span className="bg-white/20 px-4 py-2 rounded-full font-bold text-[10px] backdrop-blur-md">Alterar</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'card_background_image')} />
                </label>
              </div>
            </div>

            {/* Banner Perfil */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Banner Perfil</label>
                <input
                  type="checkbox"
                  checked={formData.show_profile_banner}
                  onChange={(e) => setFormData({ ...formData, show_profile_banner: e.target.checked })}
                  className="w-8 h-4 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 transition-all cursor-pointer relative before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all shadow-inner"
                />
              </div>
              <div className="relative h-40 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center overflow-hidden group shadow-inner">
                {formData.profile_banner_image ? (
                  <img src={formData.profile_banner_image} className="w-full h-full object-contain p-4" alt="Profile Banner" />
                ) : (
                  <div className="text-center text-gray-400">
                    <Plus className="w-8 h-8 mx-auto mb-1 opacity-20" />
                    <p className="text-[10px]">Adicionar Banner</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm">
                  <span className="bg-white/20 px-4 py-2 rounded-full font-bold text-[10px] backdrop-blur-md">Alterar</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile_banner_image')} />
                </label>
              </div>
            </div>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-blue-900 uppercase tracking-tight">Letreiro Informativo</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase">{formData.show_marquee ? 'Ativado' : 'Desativado'}</span>
                <input
                  type="checkbox"
                  checked={formData.show_marquee}
                  onChange={(e) => setFormData({ ...formData, show_marquee: e.target.checked })}
                  className="w-10 h-5 bg-gray-200 rounded-full appearance-none checked:bg-blue-600 transition-all cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:left-5.5 before:transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div>
              <input
                type="text"
                value={formData.marquee_text || ''}
                onChange={(e) => setFormData({ ...formData, marquee_text: e.target.value })}
                className="w-full px-4 py-2 border border-blue-100 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                placeholder="Promoção de hoje: Yamaha R3 com taxas especiais!"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Velocidade da Rolagem</span>
                <span className="text-blue-600">{formData.marquee_speed}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={formData.marquee_speed}
                onChange={(e) => setFormData({ ...formData, marquee_speed: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[9px] text-gray-400 italic">Menor tempo = mais rápido. Maior tempo = mais lento.</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Sincronizando...' : 'Salvar Perfil'}
        </button>
      </form>

      {/* Seção Alterar Senha */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-500" />
          Segurança da Conta
        </h2>
        <form onSubmit={handlePasswordChange} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  autoComplete="new-password"
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-1 tracking-widest">Confirmar Senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                autoComplete="new-password"
                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={passLoading || !passwordForm.password}
            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-900 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-50 disabled:opacity-50 uppercase tracking-widest text-xs"
          >
            {passLoading ? 'Alterando...' : 'Atualizar Minha Senha'}
          </button>
          <p className="text-[10px] text-center text-gray-400 italic">Por razões de segurança, utilize uma senha forte que não use em outros sites.</p>
        </form>
      </div>
    </div>
  );
}
