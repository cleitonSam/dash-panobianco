import React, { useState, useMemo } from 'react';
import { useReceivables } from '@/hooks/useReceivables';
import { MetricCard } from './MetricCard';
import { DollarSign, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, startOfDay } from 'date-fns';
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from './DateRangeFilter';
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

export const GrossRevenueDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const {
    data: receivablesData,
    isLoading: isLoadingReceivables,
    isError: isErrorReceivables,
    error: errorReceivables,
    refetch: refetchReceivables,
  } = useReceivables({
    startDate: dateRange.from ? format(startOfDay(dateRange.from), 'yyyy-MM-dd') : undefined,
    endDate: dateRange.to ? format(startOfDay(dateRange.to), 'yyyy-MM-dd') : undefined,
  });

  // Removido: getClientId duplicado

  const { totalGrossRevenue, totalTransactions, uniqueCustomers, averageTicket } = useMemo(() => {
    if (!receivablesData) return { totalGrossRevenue: 0, totalTransactions: 0, uniqueCustomers: 0, averageTicket: 0 };

    const totalRevenue = receivablesData.reduce((sum, item) => sum + parseCurrencyString(item.Valor), 0);
    const transactions = receivablesData.length;
    
    const customerIds = new Set<string>();
    receivablesData.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      if (clientId) customerIds.add(clientId);
    });
    const uniqueCustomerCount = customerIds.size;

    const avgTicket = uniqueCustomerCount > 0 ? totalRevenue / uniqueCustomerCount : 0;

    return {
      totalGrossRevenue: totalRevenue,
      totalTransactions: transactions,
      uniqueCustomers: uniqueCustomerCount,
      averageTicket: avgTicket,
    };
  }, [receivablesData]);

  const datePresets = [
    { label: 'Mês Atual', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
  ];

  if (isLoadingReceivables) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      </div>
    );
  }

  if (isErrorReceivables) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Faturamento Geral</CardTitle>
        </CardHeader>
        <CardContent>
          {errorReceivables && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorReceivables.message}</p>}
          <Button onClick={() => refetchReceivables()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Faturamento Geral (Bruto)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            dateRange={dateRange}
            onDateChange={setDateRange}
            presets={datePresets}
            disabled={isLoadingReceivables}
          />
          <Button onClick={() => refetchReceivables()} disabled={isLoadingReceivables} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingReceivables ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Faturamento Total Bruto"
          value={formatCurrency(totalGrossRevenue)}
          icon={<DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle={`Soma de ${totalTransactions} transações`}
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Total de Transações"
          value={totalTransactions.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Número de recebíveis no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Clientes Únicos (Pagantes)"
          value={uniqueCustomers.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Clientes distintos com pagamentos"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Ticket Médio (Bruto)"
          value={formatCurrency(averageTicket)}
          icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Valor médio por cliente único"
          hasLeftBorderGradient
        />
      </div>
    </div>
  );
};