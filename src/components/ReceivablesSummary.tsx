import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "./MetricCard"; // Importar MetricCard
import { formatCurrency, parseCurrencyString } from '@/utils/currency'; // Importar utilitários de moeda

interface ReceivablesSummaryProps {
  data: any[];
}

export function ReceivablesSummary({ data }: ReceivablesSummaryProps) {
  // O cálculo de totalEstimatedRevenue não será mais exibido diretamente, mas pode ser mantido se usado em outro lugar
  const totalEstimatedRevenue = data.reduce((sum, item) => {
    const value = parseCurrencyString(item.ValorContrato);
    return sum + value;
  }, 0);

  const revenuePerContractType = data.reduce((acc, item) => {
    const contractName = item.NomeContrato || 'Outros';
    const value = parseCurrencyString(item.ValorContrato);
    acc[contractName] = (acc[contractName] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  const sortedContractRevenues = Object.entries(revenuePerContractType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3); // Top 3 contratos por faturamento

  if (sortedContractRevenues.length === 0) {
    return (
      <Card className="flex items-center justify-center h-32 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <p className="text-[hsl(var(--muted-foreground))]">Nenhum dado de faturamento por contrato disponível.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedContractRevenues.map(([contractName, revenue]) => (
        <MetricCard
          key={contractName}
          title={`Faturamento ${contractName}`}
          value={formatCurrency(revenue)}
          icon={<DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle={`Total de faturamento para ${contractName}`}
          hasLeftBorderGradient
        />
      ))}
    </div>
  );
}