import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { uploadImage } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Package, Camera, Loader2, Edit2, X, Check, Copy, 
  Calculator, Search, Home as HomeIcon, MapPin, Maximize, Bed, 
  Bath, Car, ArrowRightLeft, ShieldCheck, Star 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newColor, setNewColor] = useState('#2563eb');
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; onConfirm: () => void } | null>(null);
  const [priceModal, setPriceModal] = useState<{ isOpen: boolean; productId: string | number; currentPrice: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const userNiche = user?.niche || 'vehicle';

  const VEHICLE_OPTIONALS = [
    'Ar Condicionado', 'Direção Hidráulica', 'Direção Elétrica', 'Vidros Elétricos',
    'Travas Elétricas', 'Alarme', 'Air Bag', 'Air Bag Duplo',
    'Air Bag Lateral', 'Freios ABS', 'Sensor de Estacionamento', 'Câmera de Ré',
    'Central Multimídia', 'Bluetooth', 'USB', 'GPS',
    'Teto Solar', 'Bancos de Couro', 'Banco com Regulagem Elétrica', 'Aquecedor de Bancos',
    'Volante Multifuncional', 'Piloto Automático', 'Controle de Tração', 'Controle de Estabilidade',
    'Faróis de Neblina', 'Faróis de LED', 'Retrovisores Elétricos', 'Rodas de Liga Leve',
    'Para-choques na cor do veiculo', 'IPVA Pago', 'Único Dono', 'Revisões em Dia',
    'Manual do Proprietário', 'Chave Reserva'
  ];

  const REAL_ESTATE_OPTIONALS = [
    'Piscina', 'Churrasqueira', 'Academia', 'Salão de Festas', 'Portaria 24h', 'Sistema de Alarme',
    'Elevador', 'Varanda', 'Varanda Gourmet', 'Mobiliado', 'Ar Condicionado', 'Quintal', 
    'Jardim', 'Lareira', 'Closet', 'Copa', 'Despensa', 'Escritório', 'Mezanino',
    'Dependência de Empregada', 'Área de Serviço', 'Gás Encanado', 'Interfone',
    'Armários na Cozinha', 'Armários no Banheiro', 'Armários nos Quartos',
    'Próximo ao Metrô', 'Próximo a Shopping', 'Pet Friendly', 'Acesso para Deficientes',
    'Vista Panorâmica', 'Vista para o Mar'
  ];

  const PROPERTY_TYPES = [
    'Casa', 'Apartamento', 'Sobrado', 'Terreno', 'Galpão', 'Loja', 'Sala Comercial', 'Rural', 'Chácara', 'Sítio'
  ];

  const CURRENT_OPTIONALS = userNiche === 'realestate' ? REAL_ESTATE_OPTIONALS : VEHICLE_OPTIONALS;

  const [formState, setFormState] = useState({
    name: '',
    image: '',
    description: '',
    colors: [] as string[],
    images: [] as string[],
    consortium_image: '',
    liberacred_image: '',
    has_liberacred: false,
    has_consortium: true,
    is_highlighted: false,
    year: '',
    price: '',
    mileage: '',
    brand: '',
    condition: 'Novo',
    fuel: 'Flex',
    transmission: 'Manual',
    color: '',
    optionals: [] as string[],
    show_consortium_plans: false,
    consortium_plans: [] as { installments: number; value: string }[],
    show_financing_plans: false,
    financing_plans: [] as { down_payment: string; installments: number; value: string }[],
    cash_price: '',
    card_installments: '',
    card_interest: true,
    is_active: true,
    niche: userNiche,
    property_type: 'Casa',
    property_status: 'ready',
    bedrooms: '',
    bathrooms: '',
    suites: '',
    parking_spaces: '',
    area: '',
    location: '',
    is_for_sale: true,
    is_for_rent: false,
    condo_fee: '',
    iptu: '',
    map_url: '',
    video_url: '',
    show_on_branches: true
  });

  const [newPlan, setNewPlan] = useState({ installments: 0, value: '' });
  const [newFinancingPlan, setNewFinancingPlan] = useState({ down_payment: '', installments: 0, value: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image' | 'consortium_image' | 'liberacred_image') => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const url = await uploadImage(e.target.files[0]);
      setFormState(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      if (formState.images.length >= 5) {
        toast.error('Máximo de 5 imagens na galeria');
        return;
      }
      setUploading(true);
      const url = await uploadImage(e.target.files[0]);
      setFormState(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (err) {
      toast.error('Erro ao enviar imagem da galeria');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormState(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormState({
      name: '',
      image: '',
      description: '',
      colors: [],
      images: [],
      consortium_image: '',
      liberacred_image: '',
      has_liberacred: false,
      has_consortium: true,
      is_highlighted: false,
      year: '',
      price: '',
      mileage: '',
      brand: '',
      condition: 'Novo',
      fuel: 'Flex',
      transmission: 'Manual',
      color: '',
      optionals: [],
      show_consortium_plans: false,
      consortium_plans: [],
      show_financing_plans: false,
      financing_plans: [],
      cash_price: '',
      card_installments: '',
      card_interest: true,
      is_active: true,
      niche: userNiche,
      property_type: 'Casa',
      property_status: 'ready',
      bedrooms: '',
      bathrooms: '',
      suites: '',
      parking_spaces: '',
      area: '',
      location: '',
      is_for_sale: true,
      is_for_rent: false,
      condo_fee: '',
      iptu: '',
      map_url: '',
      video_url: '',
      show_on_branches: true
    });
    setNewPlan({ installments: 0, value: '' });
    setNewFinancingPlan({ down_payment: '', installments: 0, value: '' });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") {
        setFormState({ ...formState, price: "" });
        return;
    }
    const result = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(value) / 100);
    setFormState({ ...formState, price: result });
  };

  const handlePlanValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value === "") {
        setNewPlan({ ...newPlan, value: "" });
        return;
    }
    const result = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(value) / 100);
    setNewPlan({ ...newPlan, value: result });
  };

  const handleFinancingDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const result = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(value) / 100);
    setNewFinancingPlan({ ...newFinancingPlan, down_payment: value === "" ? "" : result });
  };

  const handleFinancingValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const result = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(value) / 100);
    setNewFinancingPlan({ ...newFinancingPlan, value: value === "" ? "" : result });
  };

  const handleCashPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const result = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(value) / 100);
    setFormState({ ...formState, cash_price: value === "" ? "" : result });
  };

  const handleCardInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    setFormState({ ...formState, card_installments: value });
  };

  const addPlan = () => {
    if (newPlan.installments > 0 && newPlan.value) {
      setFormState(prev => ({
        ...prev,
        consortium_plans: [...prev.consortium_plans, newPlan]
      }));
      setNewPlan({ installments: 0, value: '' });
    }
  };

  const removePlan = (index: number) => {
    setFormState(prev => ({
      ...prev,
      consortium_plans: prev.consortium_plans.filter((_, i) => i !== index)
    }));
  };

  const addFinancingPlan = () => {
    if (newFinancingPlan.installments > 0 && newFinancingPlan.value && newFinancingPlan.down_payment) {
      setFormState(prev => ({
        ...prev,
        financing_plans: [...prev.financing_plans, newFinancingPlan]
      }));
      setNewFinancingPlan({ down_payment: '', installments: 0, value: '' });
    }
  };

  const removeFinancingPlan = (index: number) => {
    setFormState(prev => ({
      ...prev,
      financing_plans: prev.financing_plans.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      console.log('[ADMIN-SUBMIT] Sending form state:', formState);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        toast.success('Salvo!');
        closeForm();
        fetchProducts();
      } else {
        toast.error('Erro ao salvar');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormState({
      ...product,
      colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : (product.colors || []),
      images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
      optionals: typeof product.optionals === 'string' ? JSON.parse(product.optionals) : (product.optionals || []),
      consortium_plans: typeof product.consortium_plans === 'string' ? JSON.parse(product.consortium_plans) : (product.consortium_plans || []),
      financing_plans: typeof product.financing_plans === 'string' ? JSON.parse(product.financing_plans) : (product.financing_plans || []),
      show_on_branches: product.show_on_branches !== false
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Excluído!');
        fetchProducts();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">CARREGANDO...</div>;

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciar Catálogo</h2>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-bold opacity-60">Seu inventário completo de produtos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-64 h-12 pl-10 pr-4 bg-white border border-gray-100 rounded-xl outline-none focus:border-blue-200 shadow-sm transition-all" 
            />
          </div>
          <button onClick={() => setShowAddForm(true)} className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
            <Plus className="w-5 h-5" /> Novo Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {products
          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((product) => (
            <motion.div 
              layout
              key={product.id} 
              className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden group hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col"
            >
              <div className="relative h-48 lg:h-56 bg-gray-50 overflow-hidden">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button onClick={() => setShowDeleteConfirm(product.id)} className="p-2 bg-white/80 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(product)} className="p-2 bg-white/80 backdrop-blur-md text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                </div>
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.is_highlighted && (
                    <span className="px-3 py-1 bg-amber-400 text-amber-900 text-[10px] font-black uppercase rounded-lg shadow-lg flex items-center gap-1.5 border border-amber-300 backdrop-blur-sm">
                      <Star className="w-3 h-3 fill-amber-900" /> Em Destaque
                    </span>
                  )}
                  {product.is_inherited ? (
                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg border border-blue-500">Herdado</span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg border border-emerald-400">Local</span>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-black text-gray-900 uppercase tracking-tight truncate mb-1 group-hover:text-blue-600 transition-colors uppercase">{product.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-600 font-black text-xl">R$ {product.price}</span>
                  {product.year && <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-md">{product.year}</span>}
                </div>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <button 
                    onClick={() => product.is_inherited ? setPriceModal({ isOpen: true, productId: product.id, currentPrice: product.price || '' }) : handleEdit(product)}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:text-blue-700 transition-all group/btn"
                  >
                    {product.is_inherited ? <><ArrowRightLeft className="w-3 h-3" /> Preço Local</> : <><Edit2 className="w-3 h-3" /> Detalhes</>}
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={async () => {
                        const newStatus = product.is_active === false ? true : false;
                        const res = await fetch(product.is_inherited ? '/api/products/toggle' : `/api/products/${product.id}`, {
                          method: product.is_inherited ? 'POST' : 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(product.is_inherited ? { productId: product.id, isActive: newStatus } : { is_active: newStatus })
                        });
                        if (res.ok) { 
                          toast.success(newStatus ? 'Produto Ativado' : 'Produto Oculto');
                          fetchProducts(); 
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${product.is_active !== false ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-gray-200'}`}
                    >
                       <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-300 ${product.is_active !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-[9px] font-black uppercase ${product.is_active !== false ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {product.is_active !== false ? 'Ativo' : 'Oculto'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl md:rounded-[2.5rem] w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <div className="p-5 md:p-8 border-b border-gray-50 flex items-center justify-between bg-white z-10 shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 scrollbar-hide">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Nome do Item - AGORA NO TOPO (Full Width) */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nome do Veículo / Item *</label>
                    <input type="text" required value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-black text-xl transition-all uppercase tracking-tight" placeholder="Ex: HONDA CIVIC SEDAN LXR 2.0" />
                  </div>

                   {/* Especificações - EM DUAS LINHAS (4 POR LINHA) PARA FICAR MAIOR */}
                   <div className="lg:col-span-2 bg-gray-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                     {userNiche === 'vehicle' ? (
                       <>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Marca</label>
                           <input type="text" value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value})} className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all text-sm font-bold" placeholder="Marca" />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Ano</label>
                           <input type="text" value={formState.year} onChange={e => setFormState({...formState, year: e.target.value})} className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all text-sm font-bold text-center" placeholder="2024" />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Preço</label>
                           <input type="text" value={formState.price} onChange={handlePriceChange} className="w-full h-12 px-3 bg-white border border-blue-200 rounded-xl shadow-sm text-blue-600 font-black focus:border-blue-500 outline-none transition-all text-base" placeholder="0,00" />
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">KM</label>
                           <input type="text" value={formState.mileage} onChange={e => setFormState({...formState, mileage: e.target.value})} className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all text-sm font-bold text-center" placeholder="0" />
                         </div>

                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Condição</label>
                           <select value={formState.condition} onChange={e => setFormState({...formState, condition: e.target.value})} className="w-full h-12 px-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-sm">
                             <option value="Novo">Novo</option>
                             <option value="Seminovo">Seminovo</option>
                             <option value="Usado">Usado</option>
                           </select>
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Combustível</label>
                           <select value={formState.fuel} onChange={e => setFormState({...formState, fuel: e.target.value})} className="w-full h-12 px-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-sm">
                             <option value="Flex">Flex</option>
                             <option value="Gasolina">Gasolina</option>
                             <option value="Álcool">Álcool</option>
                             <option value="Diesel">Diesel</option>
                             <option value="Elétrico">Elétrico</option>
                             <option value="Híbrido">Híbrido</option>
                           </select>
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Câmbio</label>
                           <select value={formState.transmission} onChange={e => setFormState({...formState, transmission: e.target.value})} className="w-full h-12 px-2 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all font-bold text-sm">
                             <option value="Manual">Manual</option>
                             <option value="Automático">Auto</option>
                             <option value="Automatizado">Amd</option>
                             <option value="CVT">CVT</option>
                           </select>
                         </div>
                         <div className="col-span-1">
                           <label className="block text-[11px] font-black text-gray-400 uppercase mb-1.5 tracking-tight">Cor</label>
                           <input type="text" value={formState.color} onChange={e => setFormState({...formState, color: e.target.value})} className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all text-sm font-bold" placeholder="Cor" />
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="col-span-1">
                           <label className="block text-[9px] font-black text-gray-400 uppercase">Área m²</label>
                           <input type="text" value={formState.area} onChange={e => setFormState({...formState, area: e.target.value})} className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:border-blue-500 outline-none transition-all" />
                         </div>
                         <div className="col-span-2">
                            <label className="block text-[9px] font-black text-gray-400 uppercase">Preço</label>
                            <input type="text" value={formState.price} onChange={handlePriceChange} className="w-full h-12 px-4 bg-white border border-blue-200 rounded-xl shadow-sm text-blue-600 font-bold focus:border-blue-500 outline-none transition-all" />
                         </div>
                       </>
                     )}
                   </div>

                  {/* Descrição - Full Width */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Descrição</label>
                    <textarea value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl h-40 resize-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                  </div>

                   {/* Capa e Galeria - Lado a Lado */}
                   <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">Capa</label>
                       <div className="relative h-40 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden group">
                         {formState.image ? <img src={formState.image} className="w-full h-full object-contain" alt="C" /> : <Camera className="w-8 h-8 text-gray-200" />}
                         <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                           <span className="text-[10px] font-bold">Alterar</span>
                           <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'image')} />
                         </label>
                       </div>
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase">Galeria</label>
                       <div className="grid grid-cols-3 gap-2 h-40 bg-gray-50 p-2 rounded-2xl">
                         {formState.images.map((img, i) => (
                           <div key={i} className="relative rounded-lg overflow-hidden group">
                             <img src={img} className="w-full h-full object-cover" alt="G" />
                             <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>

                   {/* Cores Disponíveis (Círculos) */}
                   <div className="lg:col-span-2 bg-gray-50/30 p-6 rounded-3xl border border-gray-100">
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Cores Disponíveis (Círculos)</label>
                     <div className="flex flex-wrap items-center gap-4">
                       {formState.colors.map((c, i) => (
                         <div key={i} className="relative group">
                           <div className="w-10 h-10 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: c }} />
                           <button 
                             type="button" 
                             onClick={() => setFormState(prev => ({ ...prev, colors: prev.colors.filter((_, idx) => idx !== i) }))}
                             className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         </div>
                       ))}
                       <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100">
                         <input 
                           type="color" 
                           value={newColor} 
                           onChange={e => setNewColor(e.target.value)} 
                           className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" 
                         />
                         <button 
                           type="button" 
                           onClick={() => {
                             if (!formState.colors.includes(newColor)) {
                               setFormState(prev => ({ ...prev, colors: [...prev.colors, newColor] }));
                             }
                           }}
                           className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-all uppercase"
                         >
                           Adicionar Cor
                         </button>
                       </div>
                     </div>
                   </div>

                  {/* Vídeo URL - Full Width at Bottom */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="w-full">
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Vídeo URL</label>
                      <input type="url" value={formState.video_url} onChange={e => setFormState({...formState, video_url: e.target.value})} className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" placeholder="https://youtube.com/..." />
                    </div>
                    <div className="flex justify-end">
                       <label className={`h-14 px-6 bg-emerald-500 text-white rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 font-black text-xs uppercase tracking-widest ${formState.images.length >= 5 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                          <Camera className="w-5 h-5" /> 
                          <span>Add Foto Galeria</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleGalleryUpload} disabled={formState.images.length >= 5} />
                       </label>
                       {formState.images.length >= 5 && <p className="text-[8px] font-bold text-red-500 mt-1 uppercase text-center ml-4">Máximo 5 fotos atingido</p>}
                    </div>
                  </div>
                </div>

                {/* Seção de Funcionalidades e Visibilidade */}
                <div className="bg-gray-50/20 px-5 md:px-8 py-8 md:py-10 rounded-3xl md:rounded-[2.5rem] border border-gray-100 space-y-8 md:space-y-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600"><ShieldCheck className="w-6 h-6" /></div>
                      <h3 className="text-lg md:text-xl font-black text-gray-800 uppercase tracking-tight">Recursos e Visibilidade</h3>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Destaque Toggle */}
                        <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                           <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-md ${formState.is_highlighted ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                               <Star className={`w-3.5 h-3.5 ${formState.is_highlighted ? 'fill-amber-600' : ''}`} />
                             </div>
                             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Destaque</span>
                           </div>
                           <button type="button" onClick={() => setFormState(prev => ({ ...prev, is_highlighted: !prev.is_highlighted }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formState.is_highlighted ? 'bg-amber-500 shadow-md shadow-amber-100' : 'bg-gray-200'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formState.is_highlighted ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                        </div>

                        {/* Ativo Toggle */}
                        <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                           <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-md ${formState.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                               <Check className="w-3.5 h-3.5" />
                             </div>
                             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ativo</span>
                           </div>
                           <button type="button" onClick={() => setFormState(prev => ({ ...prev, is_active: !prev.is_active }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formState.is_active ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-gray-200'}`}>
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formState.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                        </div>

                        {/* Mostrar nas Filiais Toggle (Only for Matrix/Admin) */}
                        {!user?.root_id && (
                          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                             <div className="flex items-center gap-2">
                               <div className={`p-1.5 rounded-md ${formState.show_on_branches ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                 <ArrowRightLeft className="w-3.5 h-3.5" />
                               </div>
                               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mostrar nas Filiais</span>
                             </div>
                             <button type="button" onClick={() => setFormState(prev => ({ ...prev, show_on_branches: !prev.show_on_branches }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formState.show_on_branches ? 'bg-blue-600 shadow-md shadow-blue-100' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formState.show_on_branches ? 'translate-x-6' : 'translate-x-1'}`} />
                             </button>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Consórcio */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Tabela de Consórcio</label>
                        <button type="button" onClick={() => setFormState(prev => ({ ...prev, has_consortium: !prev.has_consortium }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formState.has_consortium ? 'bg-blue-600 shadow-md shadow-blue-100' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formState.has_consortium ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className={`transition-all duration-500 ${formState.has_consortium ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="relative h-48 bg-white rounded-3xl border border-blue-100 flex items-center justify-center overflow-hidden group shadow-sm transition-all hover:border-blue-300">
                          {formState.consortium_image ? <img src={formState.consortium_image} className="w-full h-full object-contain p-4" alt="T" /> : <div className="text-center"><Camera className="w-8 h-8 text-blue-200 mx-auto mb-2" /><span className="text-[10px] font-bold text-blue-300 uppercase">Anexar Tabela</span></div>}
                          <label className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm"><span className="bg-white/20 px-6 py-2 rounded-full font-bold text-sm backdrop-blur-md">Alterar</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'consortium_image')} /></label>
                        </div>
                      </div>
                    </div>

                    {/* Liberacred */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <label className="block text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Banner Liberacred</label>
                        <button type="button" onClick={() => setFormState(prev => ({ ...prev, has_liberacred: !prev.has_liberacred }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${formState.has_liberacred ? 'bg-orange-500 shadow-md shadow-orange-100' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${formState.has_liberacred ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className={`transition-all duration-500 ${formState.has_liberacred ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="relative h-48 bg-white rounded-3xl border border-orange-100 flex items-center justify-center overflow-hidden group shadow-sm transition-all hover:border-orange-300">
                          {formState.liberacred_image ? <img src={formState.liberacred_image} className="w-full h-full object-contain p-4" alt="B" /> : <div className="text-center"><Camera className="w-8 h-8 text-orange-200 mx-auto mb-2" /><span className="text-[10px] font-bold text-orange-300 uppercase">Anexar Banner</span></div>}
                          <label className="absolute inset-0 bg-orange-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-sm"><span className="bg-white/20 px-6 py-2 rounded-full font-bold text-sm backdrop-blur-md">Alterar</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'liberacred_image')} /></label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planos de Consórcio - DESIGN PREMIUM DO PRINT */}
                <div className="bg-white px-8 py-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-10">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                         <Calculator className="w-6 h-6 text-purple-600" />
                         <h3 className="text-xl font-black text-[#1a1a1a]">Planos de Consórcio</h3>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`${formState.show_consortium_plans ? 'text-purple-600' : 'text-gray-400'} text-[10px] font-black uppercase tracking-widest transition-colors`}>Habilitar Planos</span>
                         <button 
                           type="button" 
                           onClick={() => setFormState(prev => ({ ...prev, show_consortium_plans: !prev.show_consortium_plans }))} 
                           className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${formState.show_consortium_plans ? 'bg-purple-600 shadow-lg shadow-purple-100' : 'bg-gray-200'}`}
                         >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${formState.show_consortium_plans ? 'translate-x-7' : 'translate-x-1'}`} />
                         </button>
                      </div>
                   </div>

                   {formState.show_consortium_plans && (
                     <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                        <div className="space-y-4">
                           {formState.consortium_plans.map((p, i) => (
                             <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-md transition-all hover:bg-gray-50/50 gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-12 flex-1 min-w-0">
                                   <div className="flex items-center gap-4">
                                      <span className="text-[10px] md:text-[12px] font-black text-gray-300 uppercase italic tracking-widest shrink-0">Parcelas:</span>
                                      <span className="h-12 md:h-16 min-w-[110px] md:min-w-[150px] px-5 md:px-7 bg-purple-50 text-purple-600 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center font-black text-2xl md:text-3xl border-2 border-purple-100 shadow-sm shrink-0 transition-all">{p.installments}x</span>
                                   </div>
                                   <div className="flex flex-col gap-2">
                                      <span className="text-[10px] md:text-[12px] font-black text-gray-300 uppercase italic tracking-widest shrink-0">Investimento:</span>
                                      <div className="flex items-center gap-2">
                                         <span className="text-[10px] md:text-sm font-medium text-gray-400 italic">de</span>
                                         <span className="text-2xl md:text-3xl font-black text-[#1a1a1a]">R$ {p.value} <span className="text-[10px] md:text-sm font-normal text-gray-400 ml-1">/mês</span></span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex justify-end p-2 border-t border-gray-50 sm:border-0 sm:p-0">
                                   <button type="button" onClick={() => removePlan(i)} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-[10px] uppercase">
                                      <Trash2 className="w-4 h-4 md:w-6 md:h-6" />
                                      <span className="sm:hidden">Remover Plano</span>
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="bg-gray-50/50 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-dashed border-purple-200 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 shadow-inner">
                           <div className="w-full md:w-48"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Parcelas</label><input type="number" value={newPlan.installments || ''} onChange={e => setNewPlan({...newPlan, installments: parseInt(e.target.value) || 0})} placeholder="Qtd" className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl font-black text-center text-purple-600 shadow-sm transition-all focus:border-purple-400 outline-none" /></div>
                           <div className="w-full md:flex-1 md:min-w-[250px]"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Valor da Parcela</label><input type="text" value={newPlan.value} onChange={handlePlanValueChange} placeholder="0,00" className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl font-black text-lg shadow-sm transition-all focus:border-purple-400 outline-none" /></div>
                           <button type="button" onClick={addPlan} className="w-full md:w-auto h-14 px-10 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-xl shadow-purple-200 uppercase text-xs tracking-widest active:scale-95 transition-all">+ Add Plano</button>
                        </div>
                     </div>
                   )}
                </div>

                {/* Planos de Financiamento - DESIGN PREMIUM DO PRINT */}
                <div className="bg-white px-8 py-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-10">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                         <Calculator className="w-6 h-6 text-blue-600" />
                         <h3 className="text-xl font-black text-[#1a1a1a]">Planos de Financiamento</h3>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`${formState.show_financing_plans ? 'text-blue-600' : 'text-gray-400'} text-[10px] font-black uppercase tracking-widest transition-colors`}>Habilitar Planos</span>
                         <button 
                           type="button" 
                           onClick={() => setFormState(prev => ({ ...prev, show_financing_plans: !prev.show_financing_plans }))} 
                           className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 ${formState.show_financing_plans ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-gray-200'}`}
                         >
                            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${formState.show_financing_plans ? 'translate-x-7' : 'translate-x-1'}`} />
                         </button>
                      </div>
                   </div>

                   {formState.show_financing_plans && (
                     <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div><label className="block text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-widest">Valor à Vista</label><input type="text" value={formState.cash_price} onChange={handleCashPriceChange} placeholder="39.000,00" className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl font-black text-blue-600 text-xl shadow-sm focus:border-blue-400 outline-none transition-all" /></div>
                           <div><label className="block text-[10px] font-black text-gray-400 mb-2 ml-1 tracking-widest">Parcelas Cartão</label><div className="relative"><input type="text" value={formState.card_installments} onChange={handleCardInstallmentsChange} placeholder="10" className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl font-black text-lg shadow-sm focus:border-blue-400 outline-none transition-all" /><span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold">x</span></div></div>
                           <div className="flex items-center h-14 mt-6"><label className="flex items-center gap-4 cursor-pointer group px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-50"><input type="checkbox" checked={formState.card_interest} onChange={e => setFormState({...formState, card_interest: e.target.checked})} className="w-6 h-6 rounded-lg text-blue-600 border-gray-200" /><span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Com Juros</span></label></div>
                        </div>

                        <div className="space-y-6">
                           <label className="block text-[12px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Opções de Financiamento</label>
                           <div className="space-y-4">
                              {formState.financing_plans.map((p, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 bg-white rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-md transition-all hover:bg-gray-50/50 gap-6">
                                   <div className="flex flex-col sm:flex-row sm:items-center gap-x-12 gap-y-6 flex-1 min-w-0">
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] md:text-[12px] font-black text-gray-300 uppercase italic tracking-widest shrink-0">Entrada:</span>
                                         <span className="text-xl md:text-2xl font-black text-blue-600 truncate">R$ {p.down_payment}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                         <span className="text-[10px] md:text-[12px] font-black text-gray-300 uppercase italic tracking-widest shrink-0">Restante:</span>
                                         <span className="h-12 md:h-16 min-w-[110px] md:min-w-[150px] px-5 md:px-7 bg-blue-50 text-blue-600 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center font-black text-2xl md:text-3xl border-2 border-blue-100 shadow-sm shrink-0 transition-all">{p.installments}x</span>
                                         <div className="flex items-center gap-2 font-black text-[#1a1a1a] flex-wrap">
                                            <span className="text-[10px] md:text-sm font-medium text-gray-400 italic">de</span>
                                            <span className="text-2xl md:text-3xl">R$ {p.value} <span className="text-[10px] md:text-sm font-normal text-gray-400 ml-1">/mês</span></span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex justify-end p-2 border-t border-gray-50 sm:border-0 sm:p-0">
                                      <button type="button" onClick={() => removeFinancingPlan(i)} className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-[10px] uppercase">
                                         <Trash2 className="w-4 h-4 md:w-6 md:h-6" />
                                         <span className="sm:hidden">Remover Plano</span>
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                           <div className="bg-blue-50/30 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-dashed border-blue-200 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 shadow-inner">
                              <div className="w-full md:flex-1 md:min-w-[180px]"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Entrada</label><input type="text" value={newFinancingPlan.down_payment} onChange={handleFinancingDownPaymentChange} placeholder="R$ 0,00" className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl font-black text-blue-600 shadow-sm focus:border-blue-400 outline-none transition-all" /></div>
                              <div className="w-full md:w-48"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Parcelas</label><input type="number" value={newFinancingPlan.installments || ''} onChange={e => setNewFinancingPlan({...newFinancingPlan, installments: parseInt(e.target.value) || 0})} placeholder="Qtd" className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl font-black text-center shadow-sm focus:border-blue-400 outline-none transition-all" /></div>
                              <div className="w-full md:flex-[1.5] md:min-w-[200px]"><label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Valor Parcela</label><input type="text" value={newFinancingPlan.value} onChange={handleFinancingValueChange} placeholder="R$ 0,00" className="w-full h-14 px-6 bg-white border border-gray-200 rounded-2xl font-black text-lg shadow-sm focus:border-blue-400 outline-none transition-all" /></div>
                              <button type="button" onClick={addFinancingPlan} className="w-full md:w-auto h-14 px-10 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 uppercase text-xs tracking-widest active:scale-95 transition-all">+ Adicionar</button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className="bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight mb-4">Opcionais do {userNiche === 'realestate' ? 'Imóvel' : 'Veículo'}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 text-[10px]">
                    {CURRENT_OPTIONALS.map(opt => (
                      <label key={opt} className="flex items-center gap-2 p-2 bg-white border border-transparent hover:border-blue-100 rounded-xl cursor-pointer transition-all">
                        <input type="checkbox" checked={formState.optionals.includes(opt)} onChange={e => {
                          const newList = e.target.checked ? [...formState.optionals, opt] : formState.optionals.filter(o => o !== opt);
                          setFormState({...formState, optionals: newList});
                        }} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="truncate font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 -mx-8 -mb-8 p-6 mt-12 bg-white/90 backdrop-blur-xl border-t border-blue-50 flex items-center gap-4 z-20 rounded-b-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                  <button type="button" onClick={closeForm} className="px-12 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200">CANCELAR</button>
                  <button type="submit" disabled={submitting} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 uppercase tracking-widest text-xs">
                    {submitting ? 'SALVANDO...' : (editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PRODUTO')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-2">Confirmar Exclusão</h3>
              <p className="text-sm text-gray-500 mb-8">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => handleDeleteProduct(showDeleteConfirm)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 uppercase text-xs">Sim, Excluir</button>
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold uppercase text-xs">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {priceModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full">
            <Calculator className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-900 mb-1 text-center">Preço Regional</h3>
            <p className="text-[10px] text-gray-400 text-center mb-6 uppercase font-bold tracking-widest">Somente para esta unidade</p>
            <div className="space-y-4">
               <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 font-black">R$</div>
                  <input
                    type="text"
                    value={priceModal.currentPrice}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "");
                      const formatted = val === "" ? "" : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(val) / 100);
                      setPriceModal(prev => ({ ...prev!, currentPrice: formatted }));
                    }}
                    className="w-full pl-12 pr-4 text-2xl font-black text-blue-600 bg-gray-50 border border-gray-100 py-5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0,00"
                    autoFocus
                  />
               </div>
               <div className="flex gap-3 pt-4">
                  <button onClick={() => setPriceModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Cancelar</button>
                  <button onClick={async () => {
                    const res = await fetch('/api/products/toggle', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: priceModal.productId, priceOverride: priceModal.currentPrice })
                    });
                    if (res.ok) { toast.success('Preço salvo!'); fetchProducts(); setPriceModal(null); }
                  }} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest">Salvar</button>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
