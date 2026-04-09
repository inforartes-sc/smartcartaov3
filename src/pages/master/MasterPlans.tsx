import React, { useState, useEffect } from 'react';
import { Rocket, Plus, Trash2, Pencil, Calendar, X, Save, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
  id: number;
  name: string;
  months: number;
  price: string;
  description: string;
  features: string;
  billing_cycle: 'monthly' | 'semiannual' | 'yearly';
  is_popular: boolean;
  quota?: string;
  agencies?: string;
}

const DEFAULT_PLANS_INFO = [
  { name: 'Standard', price: '49,00', description: 'Plano Mensal - Ideal para testar o poder das vendas.', features: 'Link Personalizado, Redes Sociais, QR Code Único, Suporte via Ticket, Catálogo Completo' },
  { name: 'Premium', price: '249,00', description: 'Plano Semestral - Para quem já vende e quer crescer.', features: 'Tudo do Standard, 15% de Desconto, Banner Animado, Métricas de Visitas, Suporte Prioritário' },
  { name: 'Gold', price: '399,00', description: 'Plano Anual - Domine o mercado pelo melhor valor.', features: 'Tudo do Premium, 30% de Desconto, Domínio Próprio, Sem Logo SmartCartão, Suporte VIP 24h' }
];

export default function MasterPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    months: 1,
    price: '',
    description: '',
    features: '',
    discount: '',
    billing_cycle: 'monthly',
    is_popular: false,
    quota: '',
    agencies: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        
        // Merge with defaults if data looks empty or 0,00
        const merged = data.map((p: any) => {
          const def = DEFAULT_PLANS_INFO.find(d => d.name.toLowerCase() === p.name.toLowerCase());
          return {
            ...p,
            price: (p.price && p.price !== '0' && p.price !== '0,00') ? p.price : (def?.price || '0,00'),
            description: (p.description && p.description.trim() !== '') ? p.description : (def?.description || ''),
            features: (p.features && p.features.trim() !== '') ? p.features : (def?.features || ''),
            is_popular: p.is_popular === true || p.is_popular === 1
          };
        });
        
        setPlans(merged);
      }
    } catch (err) {
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Salvando alterações...');
    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      let finalFeatures = formData.features;
      if (formData.discount && formData.discount.toString().trim() !== '') {
        // Only append if it's not already in the string somewhere to be safe
        if (!finalFeatures.toLowerCase().includes('desconto')) {
           finalFeatures = finalFeatures ? `${finalFeatures}, ${formData.discount}% de Desconto` : `${formData.discount}% de Desconto`;
        }
      }

      const payload = {
        ...formData,
        features: finalFeatures
      };

      console.log('Sending plan data:', payload);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(editingPlan ? 'Plano atualizado!' : 'Plano criado!', { id: loadingToast });
        setShowAdd(false);
        setEditingPlan(null);
        setFormData({ name: '', months: 1, price: '', description: '', features: '', discount: '', billing_cycle: 'monthly', is_popular: false, quota: '', agencies: '' });
        fetchPlans();
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.error || 'Erro desconhecido'}`, { id: loadingToast });
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Erro ao conectar com o servidor', { id: loadingToast });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/admin/plans/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Plano removido');
        fetchPlans();
      }
    } catch (err) {
      toast.error('Erro ao remover plano');
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Planos de Acesso</h1>
          <p className="text-xs text-gray-500">Gerencie a validade, preços e visibilidade na Landing Page</p>
        </div>
        
        <button 
          onClick={() => {
            setEditingPlan(null);
            setFormData({ name: '', months: 1, price: '', description: '', features: '', discount: '', billing_cycle: 'monthly', is_popular: false, quota: '', agencies: '' });
            setShowAdd(true);
          }}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all text-xs"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      {(showAdd || editingPlan) && (
        <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50/50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-blue-600" />
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </h2>
            <button onClick={() => { setShowAdd(false); setEditingPlan(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-all">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nome do Plano</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="Ex: Diamond"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Duração (Mês)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.months}
                  onChange={(e) => setFormData({ ...formData, months: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Preço (Ex: 29,90)</label>
                <input
                  type="text"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Desconto (%)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-emerald-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-emerald-700"
                  placeholder="Ex: 15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Vagas (Ex: 10 Cartões)</label>
                <input
                  type="text"
                  value={formData.quota || ''}
                  onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Filiais (Ex: Até 5 Filiais)</label>
                <input
                  type="text"
                  value={formData.agencies || ''}
                  onChange={(e) => setFormData({ ...formData, agencies: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  placeholder="Sem Filiais"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Recursos (Separados por vírgula)</label>
                  <textarea
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-20 resize-none"
                    placeholder="Ex: Catálogo Ilimitado, Banner Customizado, Suporte VIP"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Descrição Curta</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium h-20 resize-none"
                    placeholder="Frase de impacto para o plano"
                  />
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="flex items-center gap-3">
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none ring-blue-500 focus:ring-2"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="semiannual">Semestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                  <span className="text-[10px] font-black uppercase text-gray-400">Ciclo</span>
               </div>

               <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-blue-600 transition-all">Marcar como Mais Popular</span>
               </label>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-600 text-white font-black px-12 py-4 rounded-2xl hover:bg-blue-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-blue-100 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingPlan ? 'Salvar Alterações no Plano' : 'Criar Plano para o Site'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400 text-sm animate-pulse">Sincronizando planos...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 text-sm italic">Nenhum plano cadastrado. Comece criando um para sua Landing Page.</p>
          </div>
        ) : plans.map((plan) => (
          <div key={plan.id} className={`bg-white p-8 rounded-[32px] border transition-all duration-300 group ${plan.is_popular ? 'border-blue-200 shadow-xl shadow-blue-50' : 'border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${plan.is_popular ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                <Rocket className="w-7 h-7" />
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    const parts = (plan.features || "").split(',');
                    const discountMatch = parts.find(f => f.toLowerCase().includes('desconto'));
                    const discountText = discountMatch ? discountMatch.replace(/[^0-9]/g, '') : '';
                    const featuresClean = parts.filter(f => !f.toLowerCase().includes('desconto')).join(', ').replace(/^,\s*/, '').replace(/,(\s*,)+/g, ',');

                    setEditingPlan(plan);
                    setFormData({ 
                      name: plan.name, 
                      months: plan.months,
                      price: plan.price || '',
                      description: plan.description || '',
                      features: featuresClean || '',
                      discount: discountText,
                      billing_cycle: plan.billing_cycle || 'monthly',
                      is_popular: plan.is_popular === true,
                      quota: plan.quota || '',
                      agencies: plan.agencies || ''
                    });
                  }}
                  className="p-2.5 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="p-2.5 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-600 whitespace-nowrap">R$ {plan.price || '0,00'}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">/ {plan.months} meses</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{plan.months} Meses</span>
              </div>
              {plan.is_popular && (
                <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                  <span className="text-[8px] font-black uppercase tracking-widest">Destaque Page</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
                <p className="text-[8px] uppercase font-bold text-gray-400 mb-0.5 tracking-tighter">Vagas</p>
                <p className="text-[10px] font-black text-gray-900 truncate">{plan.quota || '---'}</p>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center">
                <p className="text-[8px] uppercase font-bold text-gray-400 mb-0.5 tracking-tighter">Filiais</p>
                <p className="text-[10px] font-black text-gray-900 truncate">{plan.agencies || '---'}</p>
              </div>
            </div>

            <div className="space-y-2 mb-8 h-20 overflow-hidden">
               {(plan.features || "").split(',').slice(0, 3).map((f, i) => (
                 <div key={i} className="flex items-start gap-2 text-[11px] font-semibold text-gray-500">
                    <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="truncate">{f.trim()}</span>
                 </div>
               ))}
               {(plan.features || "").split(',').length === 0 && (
                 <p className="text-[10px] text-gray-300 italic">Sem recursos definidos</p>
               )}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
               <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ID #{plan.id}</p>
               <div className={`w-2 h-2 rounded-full ${plan.is_popular ? 'bg-blue-500 shadow-lg shadow-blue-200 animate-bounce' : 'bg-gray-200'}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Excluir Plano?</h3>
            <p className="text-sm text-gray-500 text-center mb-8">
              Tem certeza que deseja remover o plano <span className="font-bold text-gray-900">{deleteConfirm.name}</span>? Esta ação não pode ser desfeita e pode afetar usuários vinculados.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-3 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
