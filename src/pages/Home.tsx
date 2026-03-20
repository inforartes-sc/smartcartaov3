import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Instagram, Facebook, MessageCircle, Bike } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Home() {
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

  const { user } = data;

  const handleWhatsAppMain = () => {
    const phone = user.whatsapp || '5597984094999';
    window.open(`https://wa.me/${phone}?text=Olá! Vim através do seu *Cartão Digital*. Gostaria de tirar algumas dúvidas.`, '_blank');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      {/* Top Blue Bar */}
      <div className="w-full h-16 bg-[#003da5]" />

      <main className="w-full max-w-xl px-6 pt-12 flex flex-col items-center text-center">
        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-48 h-48 mb-6"
        >
          <img
            src={user.profile_image || "https://omeucartao.com.br/wp-content/uploads/2024/11/Rose-256x300.png"}
            alt={user.display_name}
            className="w-full h-full object-cover rounded-full border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Name and Role */}
        <h1 className="text-4xl font-bold text-black mb-1 font-heading">{user.display_name}</h1>
        <p className="text-gray-600 text-lg mb-10">{user.role_title}</p>

        {/* Action Buttons */}
        <div className="w-full space-y-4 mb-12">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsAppMain}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#003da5] hover:bg-[#002d7a] text-white rounded-full font-bold shadow-md transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            Vamos conversar?
          </motion.button>

          <motion.button
            onClick={() => navigate(`/${slug}/catalogo`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#003da5] hover:bg-[#002d7a] text-white rounded-full font-bold shadow-md transition-all pulsante"
          >
            <Bike className="w-5 h-5" />
            Catálogo de produtos
          </motion.button>

          {user.instagram && (
            <motion.a
              href={user.instagram}
              target="_blank"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#003da5] hover:bg-[#002d7a] text-white rounded-full font-bold shadow-md transition-all"
            >
              <Instagram className="w-5 h-5" />
              Me siga no instagram
            </motion.a>
          )}

          {user.facebook && (
            <motion.a
              href={user.facebook}
              target="_blank"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#003da5] hover:bg-[#002d7a] text-white rounded-full font-bold shadow-md transition-all"
            >
              <Facebook className="w-5 h-5" />
              Me siga no Facebook
            </motion.a>
          )}
        </div>

        {/* Bottom Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full mt-4"
        >
          <img
            src="https://omeucartao.com.br/wp-content/uploads/2025/02/17.png"
            alt="Yamaha R3"
            className="w-full h-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </main>
    </div>
  );
}
