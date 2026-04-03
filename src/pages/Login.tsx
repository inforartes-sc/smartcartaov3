import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [settings, setSettings] = useState<any>(null);

  React.useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data));
  }, []);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setUsername(emailParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingAction(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (res.ok) {
          login(data.user);
          if (data.user.is_admin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          setError(data.error || 'Erro ao fazer login');
        }
      } catch (e) {
        setError(`Erro no Servidor (${res.status}): ${text.substring(0, 50)}...`);
      }
    } catch (err: any) {
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundImage: 'url("/login-bg.png")' }}
    >
      {/* Overlay for better contrast - reduced opacity for more visibility */}
      <div className="absolute inset-0 bg-slate-900/20"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 relative z-10"
      >
        <div className="text-center mb-8">
          {(settings?.footer_logo || settings?.default_logo) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mb-6"
            >
              <img 
                src={settings.footer_logo || settings.default_logo} 
                alt="Logo" 
                className="max-h-24 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 font-heading">Login Admin</h1>
          <p className="text-gray-500 mt-2">Gerencie seu cartão digital</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input
              id="email_input_id"
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003da5] outline-none transition-all"
              placeholder="Seu usuário"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#003da5] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: '#003da5' }}
          >
            <LogIn className="w-5 h-5" />
            Entrar
          </button>
        </form>

      </motion.div>
    </div>
  );
}
