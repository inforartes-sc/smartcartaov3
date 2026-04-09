import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Search, X, MessageCircle, Link, User, Camera, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { uploadImage } from '../lib/supabase';

export default function AdminAgencies() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    slug: '',
    whatsapp: '',
    profile_image: '',
    user_limit: 5
  });

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/agencies');
      const data = await res.json();
      setAgencies(data || []);
    } catch (err) {
      toast.error('Erro ao carregar agências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const openModal = (agency?: any) => {
    if (agency) {
      setEditId(agency.id);
      setFormData({
        email: agency.email || '',
        password: '', // Hidden for editing unless user wants to change it
        display_name: agency.display_name,
        slug: agency.slug,
        whatsapp: agency.whatsapp || '',
        profile_image: agency.profile_image || '',
        user_limit: agency.user_limit || 5
      });
    } else {
      setEditId(null);
      setFormData({
        email: '',
        password: '',
        display_name: '',
        slug: '',
        whatsapp: '',
        profile_image: '',
        user_limit: 5
      });
    }
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const url = await uploadImage(file, 'images');
      setFormData({ ...formData, profile_image: url });
      toast.success('Logo enviada!');
    } catch (err: any) {
      toast.error(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editId ? 'Atualizando...' : 'Criando agência...');
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/agencies/${editId}` : '/api/agencies';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (res.ok) {
           toast.success(editId ? 'Agência atualizada!' : 'Agência criada com sucesso!', { id: loadingToast });
           setShowModal(false);
           fetchAgencies();
           return;
        }
      }
      throw new Error(`Erro no servidor (Status ${res.status}).`);
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/agencies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success('Agência removida');
      setShowDeleteConfirm(null);
      fetchAgencies();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = agencies.filter(c => 
    (c.display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Agências & Filiais</h2>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold opacity-60">Gerencie seus parceiros regionais</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100"
        >
          <ShieldCheck className="w-5 h-5" />
          Nova Agência
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-purple-200 transition-all font-medium"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest">Carregando parceiros...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <motion.div
                layout
                key={c.id}
                className="group bg-gray-50/50 hover:bg-white p-6 rounded-[2rem] border border-transparent hover:border-purple-100 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {c.profile_image ? (
                        <img
                          src={c.profile_image}
                          alt={c.display_name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-400 flex items-center justify-center border-2 border-white shadow-sm">
                           <ShieldCheck className="w-8 h-8" />
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate">{c.display_name}</h4>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">Filial Autorizada</p>
                       <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold">Cota: {c.user_limit || 5}</span>
                    </div>
                  </div>
                  <button onClick={() => openModal(c)} className="p-2 text-gray-300 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 bg-white/60 p-2.5 rounded-xl border border-white">
                    <Link className="w-3.5 h-3.5 text-purple-500" />
                    <span className="truncate italic">/{c.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <a 
                     href={`/${c.slug}`}
                     target="_blank"
                     className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-purple-600 border border-purple-50 rounded-xl text-xs font-bold hover:bg-purple-50 transition-all shadow-sm"
                   >
                     Ver Site
                   </a>
                   <button 
                     onClick={() => setShowDeleteConfirm(c.id)}
                     className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <ShieldCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhuma agência parceira</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{editId ? 'Editar Agência' : 'Nova Agência/Filial'}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Conta com acesso ao painel</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                
                {/* Logo Upload */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative group">
                    <img
                      src={formData.profile_image || "https://via.placeholder.com/150"}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-100 shadow-sm"
                      alt="Agência"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="w-8 h-8" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                    {uploading ? 'Enviando...' : 'Logo da Agência'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{editId ? 'E-mail (Bloqueado)' : 'E-mail de Login'}</label>
                    <input
                      required
                      type="email"
                      disabled={!!editId}
                      className={`w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none transition-all font-medium ${editId ? 'opacity-50 cursor-not-allowed' : 'focus:bg-white focus:border-purple-200'}`}
                      placeholder="agencia@exemplo.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{editId ? 'Sua Senha (Opcional)' : 'Senha'}</label>
                    <input
                      required={!editId}
                      type="password"
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-purple-200 transition-all font-medium"
                      placeholder={editId ? "Mantenha vazio para não alterar" : "******"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome da Agência/Cidade</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-purple-200 transition-all font-medium"
                      placeholder="ex: SmartCartão - São Paulo"
                      value={formData.display_name}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">WhatsApp de Contato</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-purple-200 transition-all font-medium"
                      placeholder="ex: 5511999999999"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cota de Usuários (Cartões)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        required
                        type="number"
                        min="1"
                        max="999"
                        className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-purple-200 transition-all font-medium"
                        placeholder="Ex: 10"
                        value={formData.user_limit}
                        onChange={(e) => setFormData({...formData, user_limit: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 h-14 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all uppercase tracking-widest text-xs"
                  >
                    {editId ? 'Atualizar Agência' : 'Salvar Agência'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-14 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all uppercase tracking-widest text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Remover Parceiro?</h3>
              <p className="text-sm text-gray-500 mb-8 px-4 font-medium">Isso excluirá a conta da agência. Esta ação não pode ser desfeita.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 text-xs uppercase"
                >
                  Sim, Excluir
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all text-xs uppercase"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
