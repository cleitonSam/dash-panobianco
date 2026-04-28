import React, { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { DollarSign, Users, TrendingUp, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { format, endOfMonth, addMonths, parse, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

interface AnnualDashboardProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  receivablesData: any[] | undefined;
  isLoadingReceivables: boolean;
  errorReceivables: Error | null;
  refetchReceivables: () => void;
}

export const AnnualDashboard: React.FC<AnnualDashboardProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
  receivablesData,
  isLoadingReceivables,
  errorReceivables,
  refetchReceivables,
}) => {
  // Removido: getClientId duplicado

  const annualMembers = useMemo(() => {
    return members.filter(member => 
      member.NomeContrato?.toLowerCase().includes('anual')
    );
  }, [members]);

  const totalAnnualMembers = annualMembers.length;

  // Set de IDs de alunos anuais para lookup rápido
  const annualMemberIds = useMemo(() => {
    const ids = new Set<string>();
    annualMembers.forEach(member => {
      const clientId = getClientId(member, 'member'); // Usar o utilitário
      if (clientId) ids.add(clientId);
    });
    return ids;
  }, [annualMembers]);

  // NOVO: Faturamento Anual Recebido (baseado em receivablesData)
  const totalAnnualRevenueReceived = useMemo(() => {
    if (!receivablesData) return 0;
    return receivablesData.reduce((sum, item) => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      // Soma apenas se o recebível for de um aluno com plano anual
      if (clientId && annualMemberIds.has(clientId)) {
        return sum + parseCurrencyString(item.Valor);
      }
      return sum;
    }, 0);
  }, [receivablesData, annualMemberIds]);

  // NOVO: Contagem de alunos anuais únicos que tiveram recebíveis no período
  const uniqueAnnualPayingMembersCount = useMemo(() => {
    if (!receivablesData) return 0;
    const payingIds = new Set<string>();
    receivablesData.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      if (clientId && annualMemberIds.has(clientId)) {
        payingIds.add(clientId);
      }
    });
    return payingIds.size;
  }, [receivablesData, annualMemberIds]);

  // NOVO: Ticket Médio Anual Recebido
  const averageAnnualTicketReceived = useMemo(() => {
    if (uniqueAnnualPayingMembersCount === 0) return 0;
    return totalAnnualRevenueReceived / uniqueAnnualPayingMembersCount;
  }, [totalAnnualRevenueReceived, uniqueAnnualPayingMembersCount]);

  const annualContractsExpiringSoon = useMemo(() => {
    if (!annualMembers || annualMembers.length === 0) return 0;

    const today = startOfDay(new Date());
    
    // Define o período: do início de hoje até o final do mês + 2 meses
    const endOfPeriod = endOfMonth(addMonths(today, 2)); // Final do mês atual + 2 meses
    
    let expiringCount = 0;

    annualMembers.forEach(member => {
      const status = member.StatusContrato?.toLowerCase() || '';
      const isDelinquent = status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado');

      if (!isDelinquent) { // Apenas alunos adimplentes
        const fimContratoStr = member.FimContrato;
        if (fimContratoStr) {
          const fimContratoDate = startOfDay(parse(fimContratoStr, 'dd/MM/yyyy', new Date()));
          
          if (fimContratoDate >= today && fimContratoDate <= endOfPeriod) {
            expiringCount++;
          }
        }
      }
    });
    return expiringCount;
  }, [annualMembers]);

  const isLoading = isLoadingMembers || isLoadingReceivables;
  const hasError = errorMembers || errorReceivables;

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
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados Anuais</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMembers && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorMembers}</p>}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Alunos Anuais"
          value={totalAnnualMembers.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--success-color))]" />}
          subtitle="Alunos com planos anuais ativos"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Faturamento Anual Recebido"
          value={formatCurrency(totalAnnualRevenueReceived)}
          icon={<DollarSign className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Soma dos recebíveis de planos anuais no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Alunos Anuais Pagantes"
          value={uniqueAnnualPayingMembersCount.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos anuais únicos com recebíveis no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Ticket Médio Anual Recebido"
          value={formatCurrency(averageAnnualTicketReceived)}
          icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Valor médio recebido por aluno anual no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Contratos Anuais a Vencer"
          value={annualContractsExpiringSoon.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Contratos anuais adimplentes vencendo nos próximos 3 meses"
          hasLeftBorderGradient
        />
      </div>
      {/* Futuros gráficos ou tabelas para planos anuais podem ser adicionados aqui */}
    </div>
  );
};