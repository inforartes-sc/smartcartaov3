import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Package, LogOut, LayoutDashboard, ExternalLink } from 'lucide-react';
import AdminProfile from './AdminProfile';
import AdminProducts from './AdminProducts';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/me')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-blue-600 font-heading">Admin Panel</h2>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-medium"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/admin/perfil"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-medium"
          >
            <User className="w-5 h-5" />
            Meu Perfil
          </Link>
          <Link
            to="/admin/produtos"
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all font-medium"
          >
            <Package className="w-5 h-5" />
            Produtos
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <a
            href={`/${user.slug}`}
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-medium mb-2"
          >
            <ExternalLink className="w-5 h-5" />
            Ver meu Cartão
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Bem-vindo, {user.display_name}!</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-2">Status do Cartão</h3>
                  <p className="text-gray-500 text-sm">Seu cartão está online e visível para todos.</p>
                  <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-mono break-all">
                    {window.location.origin}/{user.slug}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold mb-2">Dica</h3>
                  <p className="text-gray-500 text-sm">Mantenha seu catálogo atualizado para atrair mais clientes.</p>
                </div>
              </div>
            </div>
          } />
          <Route path="/perfil" element={<AdminProfile user={user} onUpdate={setUser} />} />
          <Route path="/produtos" element={<AdminProducts />} />
        </Routes>
      </main>
    </div>
  );
}
