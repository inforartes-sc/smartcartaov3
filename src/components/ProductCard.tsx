import React, { useState } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { MessageCircle, Info, FileText, Calculator, CreditCard } from 'lucide-react';
import Modal from './Modal';
import FinancingForm from './FinancingForm';
import ThreeSixtyViewer from './ThreeSixtyViewer';

export interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [activeModal, setActiveModal] = useState<'about' | 'consortium' | 'financing' | 'liberacred' | null>(null);

  const handleWhatsApp = () => {
    const message = `Olá! Vim pelo seu Cartão Digital. Tenho interesse na ${product.name}. Pode falar mais sobre ela?`;
    window.open(`https://wa.me/5597984094999?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col h-full"
    >
      <div className="p-4 flex flex-col items-center text-center flex-grow">
        <div className="relative w-full aspect-[4/3] mb-4 group">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="w-full h-[2px] bg-[#003da5] mb-6 opacity-50" />

        <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-tight">{product.name}</h3>
        
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => setActiveModal('about')}
            className="w-full py-2 px-4 bg-[#1a2b4c] hover:bg-[#121d33] text-white rounded-md transition-colors text-xs font-bold uppercase"
          >
            Sobre a moto
          </button>
          
          <button
            onClick={() => setActiveModal('consortium')}
            className="w-full py-2 px-4 bg-[#3b71ca] hover:bg-[#305eb0] text-white rounded-md transition-colors text-xs font-bold uppercase"
          >
            Plano de Consórcio
          </button>
          
          <button
            onClick={() => setActiveModal('financing')}
            className="w-full py-2 px-4 bg-[#a8328f] hover:bg-[#8a2975] text-white rounded-md transition-colors text-xs font-bold uppercase"
          >
            Financiamento
          </button>

          {product.hasLiberacred && (
            <button
              onClick={() => setActiveModal('liberacred')}
              className="w-full py-2 px-4 bg-[#f9a825] hover:bg-[#f57f17] text-white rounded-md transition-colors text-xs font-bold uppercase"
            >
              Liberacred
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
        onClose={() => setActiveModal(null)}
        title={`Sobre a ${product.name}`}
      >
        <div className="space-y-6">
          {product.threeSixtyImages ? (
            <ThreeSixtyViewer images={product.threeSixtyImages} />
          ) : (
            <img src={product.image} alt={product.name} className="w-full rounded-xl" referrerPolicy="no-referrer" />
          )}
          
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Cores Disponíveis</h4>
            <div className="flex gap-3">
              {product.colors.map(color => (
                <div
                  key={color}
                  className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'consortium'}
        onClose={() => setActiveModal(null)}
        title="Plano de Consórcio"
      >
        {product.consortiumPlanImage ? (
          <img src={product.consortiumPlanImage} alt="Plano de Consórcio" className="w-full rounded-xl" referrerPolicy="no-referrer" />
        ) : (
          <div className="p-8 text-center text-gray-500">
            Informações do plano de consórcio em breve.
          </div>
        )}
      </Modal>

      <Modal
        isOpen={activeModal === 'financing'}
        onClose={() => setActiveModal(null)}
        title="Simulação de Financiamento"
      >
        <FinancingForm 
          initialModel={product.name} 
          onSubmitSuccess={() => setActiveModal(null)} 
        />
      </Modal>

      <Modal
        isOpen={activeModal === 'liberacred'}
        onClose={() => setActiveModal(null)}
        title="Liberacred"
      >
        <div className="space-y-4">
          <img 
            src="https://omeucartao.com.br/wp-content/uploads/2025/05/10-3.png" 
            alt="Liberacred" 
            className="w-full rounded-xl" 
            referrerPolicy="no-referrer"
          />
          <p className="text-gray-600">
            O Liberacred é a facilidade que você precisava para conquistar sua Yamaha. Consulte condições especiais.
          </p>
        </div>
      </Modal>
    </motion.div>
  );
}
