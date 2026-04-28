import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { MetricCard } from "./MetricCard"; // Importar MetricCard
import { formatCurrency, parseCurrencyString } from '@/utils/currency'; // Importar utilitários de moeda

interface DelinquentRevenueSummaryProps {
  data: any[];
}

export function DelinquentRevenueSummary({ data }: DelinquentRevenueSummaryProps) {
  const parseCurrencyString = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    let cleanedValue = value.replace(/R\$\s*/, '').trim();
    cleanedValue = cleanedValue.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalDelinquentRevenue = data.reduce((sum, member) => {
    const status = member.StatusContrato?.toLowerCase() || '';
    if (status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado')) {
      const value = parseCurrencyString(member.ValorContrato);
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
      title="Faturamento Inadimplente"
      value={formatCurrency(totalDelinquentRevenue)}
      icon={<AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--danger-color))]" />}
      subtitle="Soma dos valores de contrato de alunos inadimplentes, vencidos ou cancelados"
      valueClassName="text-[hsl(var(--danger-color))]"
      hasLeftBorderGradient
    />
  );
}