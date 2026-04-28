import React, { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { startOfDay } from 'date-fns';
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

interface OnlineSalesDashboardProps {
  receivablesData: any[] | undefined;
  isLoadingReceivables: boolean;
  errorReceivables: Error | null;
  refetchReceivables: () => void;
}

export const OnlineSalesDashboard: React.FC<OnlineSalesDashboardProps> = ({
  receivablesData,
  isLoadingReceivables,
  errorReceivables,
  refetchReceivables,
}) => {
  // Removido: getClientId duplicado

  // Filter receivables for 'Venda on-line'
  const onlineSalesData = useMemo(() => {
    if (!receivablesData) return [];
    return receivablesData.filter(item => 
      item.Origem?.toLowerCase() === 'venda on-line'
    );
  }, [receivablesData]);

  // Calculate total revenue for online sales
  const totalOnlineRevenue = useMemo(() => {
    return onlineSalesData.reduce((sum, item) => sum + parseCurrencyString(item.Valor), 0);
  }, [onlineSalesData]);

  // Calculate total unique customers for online sales
  const totalUniqueOnlineCustomers = useMemo(() => {
    const uniqueIds = new Set<string>();
    onlineSalesData.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      if (clientId) uniqueIds.add(clientId);
    });
    return uniqueIds.size;
  }, [onlineSalesData]);

  // Calculate average ticket for online sales
  const averageOnlineTicket = useMemo(() => {
    if (totalUniqueOnlineCustomers === 0) return 0;
    return totalOnlineRevenue / totalUniqueOnlineCustomers;
  }, [totalOnlineRevenue, totalUniqueOnlineCustomers]);

  // Calculate unique customers per contract type for online sales (Top 10)
  const uniqueCustomersPerContract = useMemo(() => {
    const contractCustomerMap = new Map<string, Set<string>>(); // Map<Descricao, Set<clientId>>
    onlineSalesData.forEach(item => {
      // Usar a coluna 'Descricao' para o nome do contrato
      const contractName = item.Descricao || 'Desconhecido'; 
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      if (clientId) {
        if (!contractCustomerMap.has(contractName)) {
          contractCustomerMap.set(contractName, new Set<string>());
        }
        contractCustomerMap.get(contractName)?.add(clientId);
      }
    });

    return Array.from(contractCustomerMap.entries())
      .map(([name, customers]) => ({
        name,
        uniqueCustomers: customers.size,
      }))
      .sort((a, b) => b.uniqueCustomers - a.uniqueCustomers)
      .slice(0, 10); // Show top 10
  }, [onlineSalesData]);

  const isLoading = isLoadingReceivables;
  const hasError = errorReceivables;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados de Vendas Online</CardTitle>
        </CardHeader>
        <CardContent>
          {errorReceivables && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorReceivables.message}</p>}
          <Button onClick={() => { refetchReceivables(); }} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Faturamento Online"
          value={formatCurrency(totalOnlineRevenue)}
          icon={<DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle="Soma dos recebíveis de 'Venda on-line'"
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Clientes Únicos Online"
          value={totalUniqueOnlineCustomers.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Total de clientes únicos que compraram online"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Ticket Médio Online"
          value={formatCurrency(averageOnlineTicket)}
          icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Valor médio por cliente único em vendas online"
          hasLeftBorderGradient
        />
      </div>

      <Card className="glow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[hsl(var(--foreground))]">Top 10 Contratos por Clientes Únicos (Venda Online)</CardTitle>
          <Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
        </CardHeader>
        <CardContent>
          {uniqueCustomersPerContract.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={uniqueCustomersPerContract} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30 stroke-[hsl(var(--border-color))]" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} clientes`, 'Clientes Únicos']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card-bg))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--text-color))'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Bar 
                  dataKey="uniqueCustomers" 
                  fill="hsl(var(--accent-turquoise))" 
                  name="Clientes Únicos"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-8">Nenhum dado de venda online disponível para o período.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};