import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Instagram, Facebook, MessageCircle, Bike, Globe, Youtube, Twitter, Music, Mail, Phone, Linkedin, Map } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Home() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/profile/${slug}`).then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([profileData, settingsData]) => {
      setData(profileData);
      setSettings(settingsData);
    })
    .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-red-500">Perfil não encontrado</div>;

  const { user } = data;
  const socialLinks = typeof user.social_links === 'string' ? JSON.parse(user.social_links) : (user.social_links || []);

  const handleWhatsAppMain = () => {
    const message = encodeURIComponent(`Olá ${user.display_name}! Vim pelo seu Cartão Digital.`);
    window.open(`https://wa.me/${user.whatsapp}?text=${message}`, '_blank');
  };

  const isDark = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155;
  };

  const textColor = isDark(user.background_color || '#ffffff') ? 'text-white' : 'text-gray-900';
  const subtitleColor = isDark(user.background_color || '#ffffff') ? 'text-gray-300' : 'text-gray-500';

  const getIcon = (iconId: string) => {
    switch (iconId) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'youtube': return Youtube;
      case 'tiktok': return Music;
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      case 'mail': return Mail;
      case 'phone': return Phone;
      case 'map': return Map;
      default: return Globe;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center transition-colors duration-500 relative"
      style={{ 
        backgroundColor: user.background_color || '#ffffff'
      }}
    >
      {/* Top Banner with Integrated Marquee */}
      <div 
        className="w-full h-16 transition-colors duration-500 relative flex items-center overflow-hidden sticky top-0 z-50 shadow-lg" 
        style={{ backgroundColor: user.primary_color || '#003da5' }}
      >
        {user.show_marquee && user.marquee_text && (
          <motion.div
            initial={{ x: "100vw" }}
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              duration: user.marquee_speed || 20, 
              ease: "linear"
            }}
            className="whitespace-nowrap text-white text-xs md:text-sm font-bold uppercase tracking-widest absolute left-0"
            style={{ width: 'max-content' }}
          >
            {user.marquee_text}
          </motion.div>
        )}
      </div>

      <main className="w-full max-w-xl px-6 pt-12 flex flex-col items-center text-center relative z-10">
        {/* Profile Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-48 h-48 mb-6"
        >
          <img
            src={user.profile_image}
            alt={user.display_name}
            className="w-full h-full object-cover rounded-full border-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)]"
            style={{ borderColor: user.primary_color || '#003da5' }}
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Name, Establishment and Role */}
        <h1 className={`text-4xl font-bold mb-1 font-heading ${textColor}`}>{user.display_name}</h1>
        {user.establishment && (
          <p className={`${subtitleColor} text-xl font-bold mb-1 uppercase tracking-tight`}>
            {user.establishment}
          </p>
        )}
        <p className={`${subtitleColor} text-lg mb-10`}>{user.role_title}</p>

        {/* Action Buttons */}
        <div className="w-full space-y-4 mb-12">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWhatsAppMain}
            className="w-full flex items-center justify-center gap-3 py-2.5 text-white rounded-full font-bold shadow-md transition-all"
            style={{ backgroundColor: user.primary_color || '#003da5' }}
          >
            <MessageCircle className="w-5 h-5" />
            Vamos conversar?
          </motion.button>

          <motion.button
            onClick={() => navigate(`/${slug}/catalogo`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-2.5 text-white rounded-full font-bold shadow-md transition-all pulsante"
            style={{ backgroundColor: user.primary_color || '#003da5' }}
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
              className="w-full flex items-center justify-center gap-3 py-2.5 text-white rounded-full font-bold shadow-md transition-all"
              style={{ backgroundColor: user.primary_color || '#003da5' }}
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
              className="w-full flex items-center justify-center gap-3 py-2.5 text-white rounded-full font-bold shadow-md transition-all"
              style={{ backgroundColor: user.primary_color || '#003da5' }}
            >
              <Facebook className="w-5 h-5" />
              Me siga no Facebook
            </motion.a>
          )}

          {socialLinks.map((link: any, index: number) => {
            const Icon = getIcon(link.icon);
            return (
              <motion.a
                key={index}
                href={
                  link.icon === 'mail' ? `mailto:${link.url}` : 
                  link.icon === 'map' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link.url)}` : 
                  (link.url.startsWith('http') ? link.url : `https://${link.url}`)
                }
                target="_blank"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-2.5 text-white rounded-full font-bold shadow-md transition-all"
                style={{ backgroundColor: user.primary_color || '#003da5' }}
              >
                <Icon className="w-5 h-5" />
                {link.label || 'Acessar Link'}
              </motion.a>
            );
          })}
        </div>

        {/* Bottom Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -50 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100
          }}
          className="w-full mt-4"
        >
          <img
            src={user.card_bottom_image || "https://omeucartao.com.br/wp-content/uploads/2025/02/17.png"}
            alt="Yamaha R3"
            className="w-full h-auto object-contain"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Footer Credits */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="w-full py-10 mt-4 border-t border-gray-100 italic bg-gray-50/50"
        >
          <div className="max-w-xl mx-auto space-y-2 text-center">
            <p className="text-gray-400 text-[10px] leading-relaxed">
              {settings?.footer_text && <span className="mr-1">{settings.footer_text} | </span>}
              Desenvolvido por: <span className="font-bold text-gray-700">Smart Cartão</span>
            </p>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-xs font-bold hover:underline block"
            >
              Clique Aqui e faça o seu também!
            </a>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}
