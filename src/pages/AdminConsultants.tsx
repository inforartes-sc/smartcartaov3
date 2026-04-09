import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, Search, X, MessageCircle, Link, User, Camera, AlertTriangle, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { uploadImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AdminConsultants() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    whatsapp: '',
    photo_url: '',
    role_title: 'Consultor de Vendas',
    slug: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      console.log('[UPLOAD] Starting upload to bucket: images', file.name);
      
      const url = await uploadImage(file, 'images');
      setFormData({ ...formData, photo_url: url });
      toast.success('Imagem enviada!');
    } catch (err: any) {
      console.error('[UPLOAD-ERROR]', err);
      const msg = err.message || 'Erro desconhecido';
      toast.error(`Erro no upload: ${msg}`);
      if (msg.includes('row-level security')) {
        toast.error('DICA: Execute o novo script SQL que te passei para liberar o acesso público.', { duration: 6000 });
      }
    } finally {
      setUploading(false);
    }
  };

  const { user, checkMe } = useAuth();
  const limit = user?.user_limit || 5;
  const isLimitReached = consultants.length >= limit;

  const fetchConsultants = async () => {
    try {
      const res = await fetch('/api/consultants');
      const data = await res.json();
      setConsultants(data || []);
      checkMe(); // Sync header count
    } catch (err) {
      toast.error('Erro ao carregar consultores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  const openModal = (member?: any) => {
    if (member) {
      setEditId(member.id);
      setFormData({
        display_name: member.name,
        whatsapp: member.whatsapp || '',
        photo_url: member.photo_url || '',
        role_title: member.role_title || '',
        slug: member.slug || ''
      });
    } else {
      setEditId(null);
      setFormData({
        display_name: '',
        whatsapp: '',
        photo_url: '',
        role_title: 'Consultor de Vendas',
        slug: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading(editId ? 'Atualizando...' : 'Cadastrando...');
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/api/consultants/${editId}` : '/api/consultants';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success(editId ? 'Cadastro atualizado!' : 'Consultor cadastrado!', { id: loadingToast });
      setShowModal(false);
      fetchConsultants();
    } catch (err: any) {
      toast.error(err.message, { id: loadingToast });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/consultants/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      toast.success('Consultor removido com sucesso!');
      setShowDeleteConfirm(null);
      fetchConsultants();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleShare = (c: any) => {
    const url = `${window.location.origin}/${c.slug}`;
    if (navigator.share) {
      navigator.share({
        title: `Cartão de ${c.name}`,
        text: `Confira o catálogo de ${c.name}`,
        url: url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const filtered = consultants.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Equipe de Vendas</h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-gray-500 text-[10px] md:text-sm uppercase tracking-widest font-bold opacity-60">Consultores com catálogo compartilhado</p>
             <div className="h-1 w-1 bg-gray-300 rounded-full" />
             <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${isLimitReached ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {consultants.length} / {limit} UTILIZADOS
             </span>
          </div>
        </div>
        <button
          onClick={() => isLimitReached ? toast.error('Limite de usuários atingido!') : openModal()}
          disabled={isLimitReached}
          className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all shadow-lg uppercase tracking-widest text-[10px] ${isLimitReached ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
        >
          <UserPlus className="w-5 h-5" />
          Novo Consultor
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 md:p-8 shadow-sm border border-gray-100 mb-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-12 pr-6 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium text-sm"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest">Carregando equipe...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filtered.map((c) => (
              <motion.div
                layout
                key={c.id}
                className="group bg-gray-50/50 hover:bg-white p-6 rounded-[2rem] border border-transparent hover:border-blue-100 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={c.photo_url || 'https://via.placeholder.com/150'}
                      alt={c.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate">{c.name}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest truncate">{c.role_title}</p>
                  </div>
                  <button 
                    onClick={() => openModal(c)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center justify-between text-gray-500 bg-white/60 p-2.5 rounded-xl border border-white group/share">
                    <div className="flex items-center gap-2">
                       <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                       {c.whatsapp || 'Sem WhatsApp'}
                    </div>
                  </div>
                  <div 
                    onClick={() => handleShare(c)}
                    className="flex items-center justify-between text-gray-500 bg-white/60 p-2.5 rounded-xl border border-white cursor-pointer hover:bg-blue-50 hover:border-blue-100 transition-all group/link"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                       <Link className="w-3.5 h-3.5 text-blue-500" />
                       <span className="truncate italic">/{c.slug}</span>
                    </div>
                    <Share2 className="w-3.5 h-3.5 text-blue-400 group-hover/link:text-blue-600 transition-colors" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <a 
                     href={`/${c.slug}`}
                     target="_blank"
                     className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 border border-blue-50 rounded-xl text-xs font-bold hover:bg-blue-50 transition-all shadow-sm"
                   >
                     Ver Cartão
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
            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum consultor na equipe</p>
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
              className="bg-white rounded-3xl md:rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{editId ? 'Editar Consultor' : 'Novo Consultor'}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Dados de exibição e contato</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 md:p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide">
                {/* Image Upload */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative group">
                    <img
                      src={formData.photo_url || "https://via.placeholder.com/150"}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm"
                      alt="Consultor"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="w-8 h-8" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                    {uploading ? 'Enviando...' : 'Foto do Consultor'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome do Consultor</label>
                      <input
                        required
                        type="text"
                        className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-bold"
                        placeholder="Nome no cartão"
                        value={formData.display_name}
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">WhatsApp direto</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 bg-gray-100 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-bold"
                      placeholder="5511999999999"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Link (Slug)</label>
                    <input
                      required
                      type="text"
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium italic"
                      placeholder="pedro-vendas"
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Cargo ou Especialidade</label>
                    <input
                      type="text"
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium"
                      value={formData.role_title}
                      onChange={(e) => setFormData({...formData, role_title: e.target.value})}
                    />
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all uppercase tracking-widest text-[10px]"
                  >
                    {editId ? 'Atualizar Consultor' : 'Cadastrar Consultor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:flex-1 h-14 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl overflow-hidden relative"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 mb-8 px-4 font-medium">Você tem certeza que deseja remover este consultor? Esta ação não pode ser desfeita.</p>
              
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
