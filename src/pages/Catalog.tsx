import React, { useEffect, useState } from 'react';
import { Instagram, Facebook, MessageCircle, ArrowLeft, Package, Search, ChevronDown, Map, Globe, Youtube, Music, Twitter, Mail, Phone, Linkedin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const MemoProductCard = React.memo(ProductCard);


export default function Catalog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModalProductId, setActiveModalProductId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

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


  const filteredProducts = React.useMemo(() => {
    if (!data || !data.products) return [];
    const { user, products } = data;
    return products.filter((product: any) => {
      const isRealEstate = user?.niche === 'realestate';
      
      const searchStr = isRealEstate 
        ? `${product.property_type} ${product.name} ${product.location} ${product.description}`.toLowerCase()
        : `${product.brand} ${product.name} ${product.year} ${product.color} ${product.description}`.toLowerCase();
      
      const matchesSearch = searchTerm === '' || searchStr.includes(searchTerm.toLowerCase());
      
      if (isRealEstate) {
        const matchesPropertyType = selectedPropertyType === '' || product.property_type === selectedPropertyType;
        const matchesLocation = selectedLocation === '' || product.location === selectedLocation;
        return matchesSearch && matchesPropertyType && matchesLocation;
      } else {
        const matchesYear = selectedYear === '' || String(product.year) === selectedYear;
        const matchesColor = selectedColor === '' || product.color === selectedColor;
        const matchesCondition = selectedCondition === '' || product.condition === selectedCondition;
        const matchesBrand = selectedBrand === '' || product.brand === selectedBrand;
        return matchesSearch && matchesYear && matchesColor && matchesCondition && matchesBrand;
      }
    });
  }, [data, searchTerm, selectedYear, selectedColor, selectedCondition, selectedBrand, selectedPropertyType, selectedLocation]);

  const featuredFiltered = React.useMemo(() => {
    return filteredProducts.filter((p: any) => p.is_highlighted);
  }, [filteredProducts]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-red-500">Perfil não encontrado</div>;

  const { user, products } = data;



  const isDark = (color: string) => {
    const hex = (color || '#ffffff').replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 155;
  };

  const textColor = isDark(user.background_color) ? 'text-white' : 'text-gray-900';
  const subtitleColor = isDark(user.background_color) ? 'text-gray-300' : 'text-gray-500';

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: user.background_color || '#ffffff' }}
    >
      {/* Header Bar */}
      <header 
        className="w-full py-4 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors duration-500 shadow-md"
        style={{ backgroundColor: user.primary_color || '#003da5' }}
      >
        <button 
          onClick={() => navigate(`/${slug}`)}
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold font-heading">Meu Catálogo</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-12 pb-20">
        {/* Branding Section */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16 px-4">
            {/* Profile Side */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-32 h-32 lg:w-44 lg:h-44 mb-6 relative"
              >
                <img
                  src={user.profile_image || settings?.default_logo}
                  alt={user.display_name}
                  className="w-full h-full object-cover rounded-full border-4 shadow-xl"
                  style={{ borderColor: user.primary_color || '#003da5' }}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <h2 className={`text-2xl lg:text-4xl font-bold mb-1 font-heading ${textColor}`}>{user.display_name}</h2>
              <p className={`${subtitleColor} text-sm lg:text-lg mb-8 uppercase tracking-widest font-medium opacity-80`}>{user.role_title}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                {user.instagram && (
                  <a href={user.instagram} target="_blank" className="p-3 bg-pink-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-pink-100">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                <a href={`https://wa.me/${user.whatsapp || settings?.default_phone}`} target="_blank" className="p-3 bg-green-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-green-100">
                  <MessageCircle className="w-5 h-5" />
                </a>
                {user.facebook && (
                  <a href={user.facebook} target="_blank" className="p-3 bg-blue-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-blue-100">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {(() => {
                   const links = typeof user.social_links === 'string' ? JSON.parse(user.social_links) : (user.social_links || []);
                   return links.map((link: any, index: number) => {
                      const SelectedIcon = (iconName: string) => {
                        switch(iconName) {
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
                      const getIconStyle = (iconName: string) => {
                        switch(iconName) {
                          case 'instagram': return "bg-pink-500 shadow-pink-100";
                          case 'facebook': return "bg-blue-600 shadow-blue-100";
                          case 'whatsapp': return "bg-green-500 shadow-green-100";
                          case 'mail': return "bg-gray-600 shadow-gray-100";
                          case 'phone': return "bg-blue-500 shadow-blue-100";
                          case 'youtube': return "bg-red-600 shadow-red-100";
                          case 'tiktok': return "bg-black shadow-gray-200";
                          default: return "bg-gray-500 shadow-gray-100";
                        }
                      };
                      const iconStyle = getIconStyle(link.icon);
                      const Icon = SelectedIcon(link.icon);
                      return (
                        <a 
                          key={index} 
                          href={
                             link.icon === 'mail' ? `mailto:${link.url}` : 
                             link.icon === 'map' ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link.url)}` : 
                             (link.url.startsWith('http') ? link.url : `https://${link.url}`)
                          }
                          target="_blank" 
                          className={`p-3 text-white rounded-xl hover:scale-110 transition-transform shadow-lg ${iconStyle}`}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                   });
                })()}
              </div>
            </div>

            {/* Static Catalog Banner (Replaces Slider) */}
            {(user.card_background_image && user.show_catalog_banner !== false) ? (
              <div className="flex-1 flex justify-center lg:justify-end">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative w-full max-w-2xl h-full flex items-center justify-center lg:justify-end"
                >
                  <img 
                    src={user.card_background_image} 
                    alt="Banner" 
                    className="max-h-[350px] w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>
            ) : null}
          </div>

        {/* Search & Filter Bar */}
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl shadow-gray-200/50 border border-gray-100 space-y-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder={user?.niche === 'realestate' ? "Buscar por tipo, localização ou nome..." : "Buscar por marca, modelo, ano ou cor..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-100 focus:ring-4 focus:ring-blue-50 transition-all text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {user?.niche === 'realestate' ? (
                <>
                  {/* Property Type Select */}
                  <div className="relative group">
                    <select 
                      value={selectedPropertyType}
                      onChange={(e) => setSelectedPropertyType(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Todos os tipos</option>
                      {[...new Set(products.map((p: any) => p.property_type).filter(Boolean))].sort().map(type => (
                        <option key={type as string} value={type as string}>{type as string}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Location Select */}
                  <div className="relative group">
                    <select 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Todas as localizações</option>
                      {[...new Set(products.map((p: any) => p.location).filter(Boolean))].sort().map(loc => (
                        <option key={loc as string} value={loc as string}>{loc as string}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </>
              ) : (
                <>
                  {/* Intelligent Year Select */}
                  <div className="relative group">
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Todos os anos</option>
                      {[...new Set(products.map((p: any) => p.year).filter(Boolean))].sort((a: any, b: any) => b - a).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Intelligent Color Select */}
                  <div className="relative group">
                    <select 
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Todas as cores</option>
                      {[...new Set(products.map((p: any) => p.color).filter(Boolean))].sort().map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Intelligent Condition Select */}
                  <div className="relative group">
                    <select 
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Novo e Seminovo</option>
                      {[...new Set(products.map((p: any) => p.condition).filter(Boolean))].sort().map(condition => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Intelligent Brand Select */}
                  <div className="relative group">
                    <select 
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full h-12 pl-4 pr-10 bg-white border border-gray-100 rounded-xl outline-none appearance-none hover:border-gray-200 focus:border-blue-200 transition-all text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <option value="">Todas as marcas</option>
                      {[...new Set(products.map((p: any) => p.brand).filter(Boolean))].sort().map(brand => (
                        <option key={brand as string} value={brand as string}>{brand as string}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Featured Products */}
        {featuredFiltered.length > 0 && (
          <div className="mb-12">
            <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textColor}`}>
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: user.primary_color || '#003da5' }} />
              Destaques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {featuredFiltered
                .slice(0, 2)
                .map((product: any) => (
                  <div key={product.id}>
                    <MemoProductCard 
                      product={{
                        ...product,
                        colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
                        hasLiberacred: !!product.has_liberacred,
                        consortiumPlanImage: product.consortium_image,
                        liberacredImage: product.liberacred_image,
                        images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
                        optionals: typeof product.optionals === 'string' ? JSON.parse(product.optionals) : (product.optionals || []),
                        show_consortium_plans: !!product.show_consortium_plans,
                        consortium_plans: typeof product.consortium_plans === 'string' ? JSON.parse(product.consortium_plans) : (product.consortium_plans || []),
                        show_financing_plans: !!product.show_financing_plans,
                        financing_plans: typeof product.financing_plans === 'string' ? JSON.parse(product.financing_plans) : (product.financing_plans || []),
                        cash_price: product.cash_price,
                        card_installments: product.card_installments,
                        card_interest: !!product.card_interest,
                        property_status: product.property_status
                      }} 
                      whatsappNumber={user.whatsapp}
                      primaryColor={user.primary_color}
                      backgroundColor={user.background_color}
                      activeModalProductId={activeModalProductId}
                      onCloseModal={() => setActiveModalProductId(null)}
                      allProducts={products}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="mb-8">
          {filteredProducts.length > 0 ? (
            <>
              {featuredFiltered.length > 0 && (
                 <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${textColor}`}>
                  <div className="w-2 h-8 rounded-full bg-gray-200" />
                  Todos os Produtos
                </h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts
                  .filter((p: any) => !featuredFiltered.slice(0, 2).find((hp: any) => hp.id === p.id))
                  .map((product: any) => (
                    <div key={product.id}>
                      <MemoProductCard 
                        product={{
                          ...product,
                          colors: typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors,
                          hasLiberacred: !!product.has_liberacred,
                          consortiumPlanImage: product.consortium_image,
                          liberacredImage: product.liberacred_image,
                          images: typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []),
                          optionals: typeof product.optionals === 'string' ? JSON.parse(product.optionals) : (product.optionals || []),
                          show_consortium_plans: !!product.show_consortium_plans,
                          consortium_plans: typeof product.consortium_plans === 'string' ? JSON.parse(product.consortium_plans) : (product.consortium_plans || []),
                          show_financing_plans: !!product.show_financing_plans,
                          financing_plans: typeof product.financing_plans === 'string' ? JSON.parse(product.financing_plans) : (product.financing_plans || []),
                          cash_price: product.cash_price,
                          card_installments: product.card_installments,
                          card_interest: !!product.card_interest,
                          property_status: product.property_status
                        }} 
                        whatsappNumber={user.whatsapp}
                        primaryColor={user.primary_color}
                        backgroundColor={user.background_color}
                        activeModalProductId={activeModalProductId}
                        onCloseModal={() => setActiveModalProductId(null)}
                        allProducts={products}
                      />
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="py-20 text-center">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Nenhum produto encontrado com estes filtros.</p>
                <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('');
                  setSelectedColor('');
                  setSelectedCondition('');
                  setSelectedBrand('');
                  setSelectedPropertyType('');
                  setSelectedLocation('');
                }}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50/50 py-10 text-center px-6 border-t border-gray-100 italic">
        <div className="max-w-xl mx-auto space-y-2">
          <p className="text-gray-400 text-[10px] leading-relaxed">
            {settings?.footer_text && <span className="mr-1">{settings.footer_text} | </span>}
            Catálogo Digital Desenvolvido por: <span className="font-bold text-gray-700">Smart Cartão</span>
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
      </footer>
    </div>
  );
}
