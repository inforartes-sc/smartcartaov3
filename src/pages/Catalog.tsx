import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Instagram, Facebook, MessageCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/profile/${slug}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-red-500">Perfil não encontrado</div>;

  const { user, products } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <header className="w-full bg-[#003da5] py-4 px-6 flex items-center justify-between sticky top-0 z-40">
        <button 
          onClick={() => navigate(`/${slug}`)}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold font-heading">Meu Catálogo</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-20">
        {/* Profile Info Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-32 h-32 mb-4"
          >
            <img
              src={user.profile_image || "https://omeucartao.com.br/wp-content/uploads/2024/11/Rose-256x300.png"}
              alt={user.display_name}
              className="w-full h-full object-cover rounded-full border-2 border-white shadow-lg"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h2 className="text-2xl font-bold text-black mb-1 font-heading">{user.display_name}</h2>
          <p className="text-gray-500 text-sm mb-4">{user.role_title}</p>
          
          {/* Social Icons Row */}
          <div className="flex gap-4">
            {user.instagram && (
              <a href={user.instagram} target="_blank" className="p-2 bg-pink-500 text-white rounded-lg hover:scale-110 transition-transform">
                <Instagram className="w-5 h-5" />
              </a>
            )}
            <a href={`https://wa.me/${user.whatsapp || '5597984094999'}`} target="_blank" className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform">
              <MessageCircle className="w-5 h-5" />
            </a>
            {user.facebook && (
              <a href={user.facebook} target="_blank" className="p-2 bg-blue-600 text-white rounded-lg hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product: any) => (
            <div key={product.id}>
              <ProductCard product={{
                ...product,
                colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
                hasLiberacred: !!product.has_liberacred,
                consortiumPlanImage: product.consortium_image
              }} />
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-10 text-center px-6 border-t border-gray-100">
        <p className="text-gray-500 text-xs mb-2">
          Catálogo Digital Desenvolvido por: <span className="font-bold text-gray-900">O Meu Cartão</span>
        </p>
        <a
          href="https://omeucartao.com.br/"
          target="_blank"
          className="text-blue-600 text-sm font-bold hover:underline"
        >
          Clique Aqui e faça o seu também!
        </a>
      </footer>
    </div>
  );
}
