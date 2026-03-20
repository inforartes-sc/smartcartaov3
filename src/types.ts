export interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  colors: string[];
  consortiumPlanImage?: string;
  financingInfo?: string;
  hasLiberacred?: boolean;
  threeSixtyImages?: string[];
}

export interface FinancingFormData {
  nome: string;
  cidade: string;
  nascimento: string;
  cpf: string;
  telefone: string;
  modelo: string;
  entrada: string;
  status: 'assalariado' | 'autonomo';
  cnh: 'sim' | 'nao';
  renda: string;
}
