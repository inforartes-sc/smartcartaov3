import React, { useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { MessageCircle, Info, FileText, Calculator, CreditCard, ChevronLeft, ChevronRight, Package, Check, MapPin } from 'lucide-react';
import Modal from './Modal';
import FinancingForm from './FinancingForm';
import ThreeSixtyViewer from './ThreeSixtyViewer';

export interface ProductCardProps {
  product: Product;
  whatsappNumber?: string;
  primaryColor?: string;
  backgroundColor?: string;
  activeModalProductId?: string | number | null;
  onCloseModal?: () => void;
  allProducts?: Product[];
}

const formatPrice = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') return '';
  const str = value.toString();
  
  // Se já tiver vírgula e ponto (ex: 1.250,00), assume que já está formatado
  if (str.includes(',') && str.includes('.')) return str;
  
  // Se for string com vírgula mas sem ponto (ex: 1250,00), tenta ajustar
  let clean = str;
  if (str.includes(',') && !str.includes('.')) {
    clean = str.replace(',', '.');
  }

  const num = typeof value === 'number' ? value : parseFloat(clean.replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return str;
  
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default function ProductCard({ 
  product, 
  whatsappNumber, 
  primaryColor, 
  backgroundColor,
  activeModalProductId,
  onCloseModal,
  allProducts
}: ProductCardProps) {
  const [activeModal, setActiveModal] = useState<'about' | 'consortium' | 'financing' | 'liberacred' | 'video' | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [selectedFinancingIndex, setSelectedFinancingIndex] = useState<number | null>(null);

  const isRealEstate = product.niche === 'realestate';

  const themeColor = primaryColor || '#003da5';
  const allImages = [product.image, ...(product.images || [])];

  const handleWhatsApp = () => {
    const phone = whatsappNumber || '5597984094999';
    const message = isRealEstate 
      ? `Olá! Vem pelo seu Cartão Digital. Tenho interesse no imóvel ${product.name}. Pode falar mais sobre ele?`
      : `Olá! Vem pelo seu Cartão Digital. Tenho interesse no veículo ${product.name}. Pode falar mais sobre ele?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    // Log the interaction as a 'sale' intent
    fetch(`/api/products/${product.id}/sale`, { method: 'POST' }).catch(() => {});
  };

  const handleView = () => {
    setActiveModal('about');
    // Log the interaction as a 'view'
    fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {});
  };

  useEffect(() => {
    if (activeModal === 'about' && allImages.length > 1 && !isAutoPlayPaused) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [activeModal, allImages.length, isAutoPlayPaused]);

  useEffect(() => {
    let timeout: any;
    if (isAutoPlayPaused) {
      timeout = setTimeout(() => {
        setIsAutoPlayPaused(false);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [isAutoPlayPaused]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlayPaused(true);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAutoPlayPaused(true);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  useEffect(() => {
    if (activeModalProductId !== null && String(activeModalProductId) === String(product.id)) {
      handleView();
    }
  }, [activeModalProductId, product.id]);

  const handleModalClose = () => {
    setActiveModal(null);
    if (onCloseModal) onCloseModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-gray-300/40 transition-all duration-300"
    >
      <div className="p-4 flex flex-col items-center text-center flex-grow">
        <div 
          className="relative w-full aspect-[4/3] mb-4 group overflow-hidden rounded-xl cursor-pointer"
          onClick={handleView}
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="w-full h-1.5 mb-6 transition-colors rounded-full" style={{ backgroundColor: themeColor }} />

        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-tight">{product.name}</h3>
        
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={handleView}
            className="w-full py-2 px-4 text-white rounded-md transition-all text-xs font-bold uppercase hover:brightness-110"
            style={{ backgroundColor: themeColor }}
          >
            {isRealEstate ? 'Sobre o imóvel' : 'Sobre o veículo'}
          </button>
          
          {(product.has_consortium !== false || product.show_financing_plans) && (
            <button
              onClick={() => setActiveModal('plans')}
              className="w-full py-2 px-4 bg-[#3b71ca] hover:bg-[#305eb0] text-white rounded-md transition-all text-xs font-bold uppercase"
            >
              Consórcio / Financiamento
            </button>
          )}

          <button
            onClick={() => setActiveModal('financing')}
            className="w-full py-2 px-4 bg-[#a8328f] hover:bg-[#8a2975] text-white rounded-md transition-colors text-xs font-bold uppercase"
          >
            {isRealEstate ? 'Simular Financiamento' : 'Simular Financiamento'}
          </button>

          {product.hasLiberacred && (
            <button
              onClick={() => setActiveModal('liberacred')}
              className="w-full py-2 px-4 bg-[#f9a825] hover:bg-[#f57f17] text-white rounded-md transition-colors text-xs font-bold uppercase"
            >
              Liberacred
            </button>
          )}

          {product.video_url && (
            <button
              onClick={() => setActiveModal('video')}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs font-bold uppercase"
            >
              Vídeo de Apresentação
            </button>
          )}
          
          <button
            onClick={handleWhatsApp}
            className="w-full py-2 px-4 bg-[#5cb85c] hover:bg-[#4cae4c] text-white rounded-md transition-colors text-xs font-bold uppercase flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-3 h-3" />
            Entrar em contato
          </button>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={activeModal === 'about'}
        onClose={handleModalClose}
        title={
          <div className="flex flex-col pt-2">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{isRealEstate ? 'Sobre o Imóvel' : 'Sobre o Veículo'}</span>
            <span className="text-xl font-black text-gray-900 uppercase tracking-tight leading-tight">{product.name}</span>
          </div>
        }
      >
        <div className="space-y-6">
          {product.threeSixtyImages ? (
            <ThreeSixtyViewer images={product.threeSixtyImages} />
          ) : (
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl bg-gray-50">
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                src={allImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 shadow-lg rounded-full text-white transition-all z-20"
                    style={{ backgroundColor: themeColor }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 shadow-lg rounded-full text-white transition-all z-20"
                    style={{ backgroundColor: themeColor }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all border border-white/50 shadow-sm ${
                          idx === currentImageIndex ? 'scale-125' : 'bg-gray-300'
                        }`}
                        style={{ backgroundColor: idx === currentImageIndex ? themeColor : undefined }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
            {/* Detalhes do Veículo / Imóvel */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              {isRealEstate ? (
                <>
                  {product.property_type && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Tipo</p>
                      <p className="text-sm font-bold text-gray-800">{product.property_type}</p>
                    </div>
                  )}
                  {product.price && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Preço</p>
                      <p className="text-sm font-bold text-emerald-600">R$ {formatPrice(product.price)}</p>
                    </div>
                  )}
                  {product.condo_fee && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Condomínio</p>
                      <p className="text-sm font-bold text-gray-800">R$ {formatPrice(product.condo_fee)}</p>
                    </div>
                  )}
                  {product.iptu && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">IPTU</p>
                      <p className="text-sm font-bold text-gray-800">R$ {formatPrice(product.iptu)}</p>
                    </div>
                  )}
                  {product.area && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Área</p>
                      <p className="text-sm font-bold text-gray-800">{product.area} m²</p>
                    </div>
                  )}
                  {product.bedrooms && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Quartos</p>
                      <p className="text-sm font-bold text-gray-800">{product.bedrooms}</p>
                    </div>
                  )}
                  {product.bathrooms && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Banheiros</p>
                      <p className="text-sm font-bold text-gray-800">{product.bathrooms}</p>
                    </div>
                  )}
                  {product.parking_spaces && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Vagas</p>
                      <p className="text-sm font-bold text-gray-800">{product.parking_spaces}</p>
                    </div>
                  )}
                  {product.location && (
                    <div className="col-span-2 flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Localização</p>
                        <p className="text-sm font-bold text-gray-800">{product.location}</p>
                      </div>
                      {product.map_url && (
                        <a 
                          href={product.map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors py-1.5 w-fit"
                        >
                          <MapPin className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase border-b border-blue-600/30">Ver no Google Maps</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {product.year && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Ano</p>
                      <p className="text-sm font-bold text-gray-800">{product.year}</p>
                    </div>
                  )}
                  {product.price && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Preço</p>
                      <p className="text-sm font-bold text-emerald-600">R$ {formatPrice(product.price)}</p>
                    </div>
                  )}
                  {product.mileage && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Quilometragem</p>
                      <p className="text-sm font-bold text-gray-800">{product.mileage} km</p>
                    </div>
                  )}
                  {product.brand && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Marca</p>
                      <p className="text-sm font-bold text-gray-800">{product.brand}</p>
                    </div>
                  )}
                  {product.condition && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Condição</p>
                      <p className="text-sm font-bold text-gray-800">{product.condition}</p>
                    </div>
                  )}
                  {product.fuel && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Combustível</p>
                      <p className="text-sm font-bold text-gray-800">{product.fuel}</p>
                    </div>
                  )}
                  {product.transmission && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Câmbio</p>
                      <p className="text-sm font-bold text-gray-800">{product.transmission}</p>
                    </div>
                  )}
                  {product.color && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Cor</p>
                      <p className="text-sm font-bold text-gray-800">{product.color}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Opcionais */}
            {(product.optionals && (typeof product.optionals === 'string' ? JSON.parse(product.optionals) : product.optionals).length > 0) && (
              <div className="space-y-3">
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  Opcionais e Itens de Série
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(typeof product.optionals === 'string' ? JSON.parse(product.optionals) : (product.optionals || [])).map((opt: string) => (
                    <div key={opt} className="flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.niche !== 'realestate' && product.colors && product.colors.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg">Cores Disponíveis</h4>
                <div className="flex gap-3">
                  {product.colors?.map(color => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-left">DESCRIÇÃO DETALHADA</h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-left">
                  {product.description}
                </p>
              </div>
            </div>
            </div>
            <button
              onClick={handleWhatsApp}
              className="w-full py-4 px-6 flex items-center justify-center gap-2 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 mt-6"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle className="w-6 h-6" />
              SOLICITAR CONSULTORIA NO WHATSAPP
            </button>
        </Modal>

      <Modal
        isOpen={activeModal === 'plans'}
        onClose={handleModalClose}
        title="Consórcio e Financiamento"
      >
        <div className="space-y-6">
          {/* Plano de Financiamento (Seção Superior) */}
          {product.show_financing_plans && (
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-3 h-3" />
                  Simulações de Financiamento
                </h4>
                
                {product.cash_price && (
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">À Vista</span>
                    <span className="text-lg font-black text-blue-700 text-right">R$ {product.cash_price}</span>
                  </div>
                )}
                
                {product.card_installments && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">No Cartão</span>
                    <span className="text-xs font-bold text-gray-800">
                      {product.card_installments} {product.card_interest ? 'c/ Juros' : 's/ Juros'}
                    </span>
                  </div>
                )}
              </div>

              {product.financing_plans && product.financing_plans.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-1">
                    Escolha uma opção para simular:
                  </p>
                  {product.financing_plans.map((plan, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedFinancingIndex(idx)}
                      className={`flex items-center justify-between p-5 border rounded-2xl shadow-sm transition-all cursor-pointer ${
                        selectedFinancingIndex === idx 
                          ? 'bg-blue-600 border-blue-600 shadow-blue-200' 
                          : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedFinancingIndex === idx 
                            ? 'bg-white border-white text-blue-600' 
                            : 'border-blue-200 text-transparent'
                        }`}>
                          {selectedFinancingIndex === idx && <Check className="w-3 h-3 stroke-[4px]" />}
                        </div>
                        <div className="flex flex-col">
                           <span className={`text-xs font-black uppercase leading-none mb-1.5 ${selectedFinancingIndex === idx ? 'text-white/90' : 'text-blue-600'}`}>
                             Entrada R$ {plan.down_payment}
                           </span>
                           <div className="flex items-center gap-3">
                             <span className={`px-3 py-1 rounded-full text-xs font-black ${selectedFinancingIndex === idx ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                               {plan.installments}x
                             </span>
                             <span className={`font-medium ${selectedFinancingIndex === idx ? 'text-white' : 'text-gray-700'}`}>
                               de <span className={`font-extrabold text-lg ${selectedFinancingIndex === idx ? 'text-white' : 'text-blue-700'}`}>R$ {plan.value}</span> /mês
                             </span>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Calculator className={`w-5 h-5 ${selectedFinancingIndex === idx ? 'text-white/50' : 'text-blue-200'}`} />
                        {selectedFinancingIndex === idx && (
                          <span className="text-[8px] font-black text-white px-1.5 py-0.5 bg-white/20 rounded uppercase tracking-tighter">
                            Selecionado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center italic py-1">
                * Sujeito a análise de crédito
              </p>
            </div>
          )}

          {/* Plano de Consórcio (Seção Inferior) */}
          {(product.show_consortium_plans || product.consortium_plans?.length > 0) && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calculator className="w-3 h-3" />
                Planos de Consórcio
              </h4>
              
              {product.consortium_plans && product.consortium_plans.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {product.consortium_plans.map((plan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-purple-50/30 border border-purple-100 rounded-2xl shadow-sm transition-all hover:bg-purple-50">
                      <div className="flex items-center gap-4">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-black">{plan.installments}x</span>
                        <span className="text-gray-700 font-medium">de <span className="text-purple-700 font-extrabold text-lg">R$ {plan.value}</span> /mês</span>
                      </div>
                      <Calculator className="w-5 h-5 text-purple-200" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Imagem de Referência */}
          {product.consortiumPlanImage ? (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tabela de Referência</h4>
              <img src={product.consortiumPlanImage} alt="Referência" className="w-full rounded-xl shadow-md" referrerPolicy="no-referrer" />
            </div>
          ) : (!product.show_consortium_plans && !product.show_financing_plans) && (
            <div className="p-8 text-center text-gray-400 text-sm italic">
              Informações de planos indisponíveis para este {isRealEstate ? 'imóvel' : 'veículo'}.
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => setActiveModal('financing')}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all text-sm font-black uppercase shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              Solicitar Análise de Crédito
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'financing'}
        onClose={handleModalClose}
        title="Simulação de Financiamento"
      >
        <FinancingForm 
          initialModel={product.name} 
          initialProductId={product.id}
          initialColor={product.color}
          initialEntrada={selectedFinancingIndex !== null ? product.financing_plans[selectedFinancingIndex].down_payment : undefined}
          initialPlan={selectedFinancingIndex !== null ? { 
            installments: product.financing_plans[selectedFinancingIndex].installments,
            value: product.financing_plans[selectedFinancingIndex].value 
          } : undefined}
          allProducts={allProducts}
          whatsappNumber={whatsappNumber}
          onSubmitSuccess={() => setActiveModal(null)} 
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'liberacred'}
        onClose={handleModalClose}
        title="Liberacred"
      >
        <div className="space-y-4">
          <img 
            src={product.liberacredImage || "https://omeucartao.com.br/wp-content/uploads/2025/05/10-3.png"} 
            alt="Liberacred" 
            className="w-full rounded-xl" 
            referrerPolicy="no-referrer"
          />
          <p className="text-gray-600">
            O Liberacred é a facilidade que você precisava para conquistar sua Yamaha. Consulte condições especiais.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'video'}
        onClose={handleModalClose}
        title="Vídeo de Apresentação"
      >
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          {product.video_url?.includes('youtube.com') || product.video_url?.includes('youtu.be') ? (
            <iframe 
              src={`https://www.youtube.com/embed/${product.video_url.includes('v=') ? product.video_url.split('v=')[1].split('&')[0] : product.video_url.split('/').pop()}`}
              className="w-full h-full"
              allowFullScreen
            />
          ) : product.video_url?.includes('vimeo.com') ? (
            <iframe 
              src={`https://player.vimeo.com/video/${product.video_url.split('/').pop()}`}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <video 
              src={product.video_url} 
              controls 
              className="w-full h-full"
              autoPlay
            />
          )}
        </div>
      </Modal>
    </motion.div>
  );
}
