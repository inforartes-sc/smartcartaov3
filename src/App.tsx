/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';

function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-5xl font-bold text-blue-600 mb-4 font-heading">O Meu Cartão</h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        Crie seu cartão de visita digital com catálogo de produtos em minutos.
      </p>
      <div className="flex gap-4">
        <Link to="/login" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
          Entrar
        </Link>
        <Link to="/register" className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all">
          Criar Conta
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/:slug" element={<Home />} />
        <Route path="/:slug/catalogo" element={<Catalog />} />
      </Routes>
    </Router>
  );
}
