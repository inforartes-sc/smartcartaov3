import React, { useState } from 'react';
import { FinancingFormData } from '../types';
import { Send } from 'lucide-react';

interface FinancingFormProps {
  initialModel?: string;
  onSubmitSuccess: () => void;
}

export default function FinancingForm({ initialModel, onSubmitSuccess }: FinancingFormProps) {
  const [formData, setFormData] = useState<FinancingFormData>({
    nome: '',
    cidade: '',
    nascimento: '',
    cpf: '',
    telefone: '',
    modelo: initialModel || '',
    entrada: '',
    status: 'assalariado',
    cnh: 'sim',
    renda: ''
  });

  const maskCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const maskCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) return '';
    const numberValue = parseInt(cleanValue) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
  };

  const maskDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{4})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'cpf') maskedValue = maskCpf(value);
    if (name === 'telefone') maskedValue = maskPhone(value);
    if (name === 'entrada' || name === 'renda') maskedValue = maskCurrency(value);
    if (name === 'nascimento') maskedValue = maskDate(value);

    setFormData(prev => ({ ...prev, [name]: maskedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real app, send to API or WhatsApp
    const message = `Olá! Vim pelo seu Cartão Digital. Gostaria de uma simulação de financiamento:
Nome: ${formData.nome}
Cidade: ${formData.cidade}
Nascimento: ${formData.nascimento}
CPF: ${formData.cpf}
Telefone: ${formData.telefone}
Modelo: ${formData.modelo}
Entrada: ${formData.entrada}
Status: ${formData.status}
CNH: ${formData.cnh}
Renda: ${formData.renda}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5597984094999?text=${encodedMessage}`, '_blank');
    onSubmitSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
        <input
          type="text"
          name="nome"
          required
          value={formData.nome}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          placeholder="Seu nome completo"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input
            type="text"
            name="cidade"
            required
            value={formData.cidade}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Sua cidade"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
          <input
            type="text"
            name="nascimento"
            required
            value={formData.nascimento}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="DD/MM/AAAA"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
          <input
            type="text"
            name="cpf"
            required
            value={formData.cpf}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="text"
            name="telefone"
            required
            value={formData.telefone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Modelo da Moto</label>
        <select
          name="modelo"
          required
          value={formData.modelo}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">Selecione um modelo</option>
          <option value="Neos Connected">Neos Connected</option>
          <option value="Fluo ABS Connected">Fluo ABS Connected</option>
          <option value="Nmax 160 ABS">Nmax 160 ABS</option>
          <option value="Xmax 300 Connected">Xmax 300 Connected</option>
          <option value="Fazer FZ15 ABS">Fazer FZ15 ABS</option>
          <option value="Factor 150 ED UBS">Factor 150 ED UBS</option>
          <option value="Lander 250 ABS">Lander 250 ABS</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Entrada</label>
          <input
            type="text"
            name="entrada"
            required
            value={formData.entrada}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="R$ 0,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Renda Mensal</label>
          <input
            type="text"
            name="renda"
            required
            value={formData.renda}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="R$ 0,00"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Profissional</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="assalariado">Sou assalariado</option>
            <option value="autonomo">Sou autônomo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Possui CNH?</label>
          <select
            name="cnh"
            value={formData.cnh}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="sim">Sim, possuo</option>
            <option value="nao">Não possuo</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
      >
        <Send className="w-5 h-5" />
        Enviar Simulação
      </button>
    </form>
  );
}
