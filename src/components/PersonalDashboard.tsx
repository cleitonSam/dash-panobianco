import React, { useMemo } from 'react';
import { MetricCard } from './MetricCard';
import { DollarSign, Users, TrendingUp, CalendarIcon, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { endOfMonth, parse, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

interface PersonalDashboardProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  receivablesData: any[] | undefined;
  isLoadingReceivables: boolean;
  errorReceivables: Error | null;
  refetchReceivables: () => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
  receivablesData,
  isLoadingReceivables,
  errorReceivables,
  refetchReceivables,
}) => {
  // Removido: getClientId duplicado

  const personalMembers = useMemo(() => {
    return members.filter(member => 
      member.NomeContrato?.toLowerCase().includes('personal')
    );
  }, [members]);

  const totalPersonalMembers = personalMembers.length;

  // Set de IDs de alunos Personal para lookup rápido
  const personalMemberIds = useMemo(() => {
    const ids = new Set<string>();
    personalMembers.forEach(member => {
      const clientId = getClientId(member, 'member'); // Usar o utilitário
      if (clientId) ids.add(clientId);
    });
    return ids;
  }, [personalMembers]);

  // Faturamento Personal Recebido (baseado em receivablesData)
  const totalPersonalRevenueReceived = useMemo(() => {
    if (!receivablesData) return 0;
    return receivablesData.reduce((sum, item) => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      // Soma apenas se o recebível for de um aluno com plano Personal
      if (clientId && personalMemberIds.has(clientId)) {
        return sum + parseCurrencyString(item.Valor);
      }
      return sum;
    }, 0);
  }, [receivablesData, personalMemberIds]);

  // Contagem de alunos Personal únicos que tiveram recebíveis no período
  const uniquePersonalPayingMembersCount = useMemo(() => {
    if (!receivablesData) return 0;
    const payingIds = new Set<string>();
    receivablesData.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      if (clientId && personalMemberIds.has(clientId)) {
        payingIds.add(clientId);
      }
    });
    return payingIds.size;
  }, [receivablesData, personalMemberIds]);

  // Ticket Médio Personal Recebido
  const averagePersonalTicketReceived = useMemo(() => {
    if (uniquePersonalPayingMembersCount === 0) return 0;
    return totalPersonalRevenueReceived / uniquePersonalPayingMembersCount;
  }, [totalPersonalRevenueReceived, uniquePersonalPayingMembersCount]);

  const personalContractsExpiringSoon = useMemo(() => {
    if (!personalMembers || personalMembers.length === 0) return 0;

    const today = startOfDay(new Date());

    // Define o período: do início de hoje até o final do MÊS ATUAL
    const endOfCurrentMonth = endOfMonth(today); 
    
    let expiringCount = 0;

    personalMembers.forEach(member => {
      const status = member.StatusContrato?.toLowerCase() || '';
      const isDelinquent = status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado');

      if (!isDelinquent) { // Apenas alunos adimplentes
        const fimContratoStr = member.FimContrato;
        if (fimContratoStr) {
          const fimContratoDate = startOfDay(parse(fimContratoStr, 'dd/MM/yyyy', new Date()));

          // Verifica se a data de fim do contrato está entre hoje e o final do mês atual
          if (fimContratoDate >= today && fimContratoDate <= endOfCurrentMonth) {
            expiringCount++;
          }
        }
      }
    });
    return expiringCount;
  }, [personalMembers]);

  const percentagePayingPersonal = useMemo(() => {
    if (totalPersonalMembers === 0) return 0;
    return (uniquePersonalPayingMembersCount / totalPersonalMembers) * 100;
  }, [uniquePersonalPayingMembersCount, totalPersonalMembers]);

  const percentageColorClass = percentagePayingPersonal >= 90 ? 'text-[hsl(var(--success-color))]' : 'text-[hsl(var(--danger-color))]';

  const isLoading = isLoadingMembers || isLoadingReceivables;
  const hasError = errorMembers || errorReceivables;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[120px]" />
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
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados Personal</CardTitle>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Faturamento Personal Recebido"
          value={formatCurrency(totalPersonalRevenueReceived)}
          icon={<DollarSign className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Soma dos recebíveis de planos Personal no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Total Alunos Personal"
          value={totalPersonalMembers.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--success-color))]" />}
          subtitle="Alunos com planos Personal ativos"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Alunos Personal Pagantes"
          value={uniquePersonalPayingMembersCount.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos Personal únicos com recebíveis no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Ticket Médio Personal Recebido"
          value={formatCurrency(averagePersonalTicketReceived)}
          icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Valor médio recebido por aluno Personal no período"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Contratos Personal a Vencer"
          value={personalContractsExpiringSoon.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Contratos Personal adimplentes vencendo até o final do mês"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Pagantes vs. Ativos (Personal)"
          value={`${percentagePayingPersonal.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Alunos Personal com recebíveis em relação aos ativos"
          valueClassName={percentageColorClass}
          hasLeftBorderGradient
        />
      </div>
      {/* Futuros gráficos ou tabelas para planos Personal podem ser adicionados aqui */}
    </div>
  );
};