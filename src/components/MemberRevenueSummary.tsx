import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { MetricCard } from "./MetricCard"; // Importar MetricCard
import { formatCurrency, parseCurrencyString } from '@/utils/currency'; // Importar utilitários de moeda

interface MemberRevenueSummaryProps {
  data: any[];
}

export function MemberRevenueSummary({ data }: MemberRevenueSummaryProps) {
  const parseCurrencyString = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    let cleanedValue = value.replace(/R\$\s*/, '').trim();
    cleanedValue = cleanedValue.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const nonStandardPlanKeywords = [
    'influenciador',
    'combo', // Catches 'combo 3 diárias'
    'diaria', // Catches '3 diárias'
    'wellhub',
    'totalpass',
    'total pass', // For variations
    'gurupass',
    'vip', // Simplificado para pegar todos os VIPs
    'gympass',
    'cortesia', // Adicionado
    'teste',    // Adicionado
    'promocional', // Adicionado
    'free',     // Adicionado
    'gratis',      // Adicionado
  ];

  const totalMemberContractRevenue = data.reduce((sum, member) => {
    const status = member.StatusContrato?.toLowerCase() || '';
    const contractName = member.NomeContrato?.toLowerCase() || '';

    // 1. Excluir planos especiais/parceiros
    const isStandardPlan = !nonStandardPlanKeywords.some(keyword => contractName.includes(keyword));

    // 2. Incluir apenas se for um plano padrão E não for inadimplente/vencido/cancelado
    if (isStandardPlan && !status.includes('inadimplente') && !status.includes('vencido') && !status.includes('cancelado')) {
      let value = parseCurrencyString(member.ValorContrato);
      
      // 3. Aplicar correção de valor para recorrentes/promocionais abaixo do mínimo
      if (
        (contractName.includes('recorrente') || contractName.includes('darsj promocional')) &&
        value < 179.90
      ) {
        value = 179.90;
      }
      
      // 4. Mensalizar planos anuais
      if (contractName.includes('anual')) {
        value = value / 12;
      }
      return sum + value;
    }
    return sum;
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MetricCard
      title="Faturamento Total"
      value={formatCurrency(totalMemberContractRevenue)}
      icon={<DollarSign className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--primary))]" />}
      subtitle="Soma dos valores de contrato dos alunos adimplentes (planos padrão mensalizados)"
      valueClassName="text-[hsl(var(--primary))]"
      hasLeftBorderGradient
    />
  );
}