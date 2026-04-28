import React, { useMemo } from 'react';
import { useReceivables } from '@/hooks/useReceivables';
import { MetricCard } from './MetricCard';
import { CalendarIcon, DollarSign, Users, Percent, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, endOfMonth, parse, startOfDay } from 'date-fns';
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

interface ReceivablesDashboardProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
}

export const ReceivablesDashboard: React.FC<ReceivablesDashboardProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
}) => {
  const {
    data: receivablesData,
    isLoading: isLoadingReceivables,
    isError: isErrorReceivables,
    error: errorReceivables,
    refetch: refetchReceivables,
  } = useReceivables(); // Chamada simplificada, sempre para o mês atual

  const memberContractMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach(member => {
      const clientId = getClientId(member, 'member'); // Usar o utilitário
      if (clientId) {
        map.set(clientId, member.NomeContrato?.toLowerCase() || '');
      }
    });
    return map;
  }, [members]);

  const allPayingMemberIds = useMemo(() => {
    if (!receivablesData) return new Set<string>();
    const ids = new Set<string>();
    receivablesData.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      const contractName = (clientId && memberContractMap.get(clientId)) || ''; 
      // Mantemos a exclusão de 'anual' aqui, pois o ReceivablesDashboard foca em pagamentos mensais/recorrentes.
      if (clientId && !contractName.includes('anual')) {
        ids.add(clientId);
      }
    });
    return ids;
  }, [receivablesData, memberContractMap]);

  const nonStandardReceivablesKeywords = [
    'influenciador',
    'combo',
    'diaria',
    'wellhub',
    'totalpass',
    'total pass',
    'gurupass',
    'anual', // Excluir anual especificamente para este dashboard
    'vip',
    'gympass',
    'cortesia',
    'teste',
    'promocional',
    'free',
    'gratis',
  ];

  const standardActiveMemberIds = useMemo(() => {
    const ids = new Set<string>();
    members.forEach(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      const isStandardPlan = !nonStandardReceivablesKeywords.some(keyword => planName.includes(keyword));
      if (isStandardPlan) {
        const memberId = getClientId(member, 'member'); // Usar o utilitário
        if (memberId) {
          ids.add(memberId);
        }
      }
    });
    return ids;
  }, [members]);

  const activeMembersWhoPaidCount = useMemo(() => {
    let count = 0;
    allPayingMemberIds.forEach(id => {
      if (standardActiveMemberIds.has(id)) {
        count++;
      }
    });
    return count;
  }, [allPayingMemberIds, standardActiveMemberIds]);

  const totalActiveMembers = standardActiveMemberIds.size;
  const uniquePayingMembersCount = activeMembersWhoPaidCount; 

  const percentagePayingMembers = useMemo(() => {
    if (totalActiveMembers === 0) return 0;
    return (activeMembersWhoPaidCount / totalActiveMembers) * 100;
  }, [activeMembersWhoPaidCount, totalActiveMembers]);

  const percentageColorClass = percentagePayingMembers >= 90 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--danger-color))]'; // Alterado para primary

  const averageTicketReceivables = useMemo(() => {
    if (uniquePayingMembersCount === 0) return 0;
    
    let totalRevenueFromActivePayingMembers = 0;
    receivablesData?.forEach(item => {
      const clientId = getClientId(item, 'receivable'); // Usar o utilitário
      const contractName = (clientId && memberContractMap.get(clientId)) || ''; 
      if (clientId && standardActiveMemberIds.has(clientId) && !contractName.includes('anual')) { 
        totalRevenueFromActivePayingMembers += parseCurrencyString(item.Valor);
      }
    });

    if (activeMembersWhoPaidCount === 0) return 0; 
    return totalRevenueFromActivePayingMembers / activeMembersWhoPaidCount;

  }, [receivablesData, uniquePayingMembersCount, activeMembersWhoPaidCount, standardActiveMemberIds, memberContractMap]);

  const contractsExpiringSoon = useMemo(() => {
    if (!members || members.length === 0) return 0;
    const today = startOfDay(new Date());
    
    let expiringCount = 0;
    const endOfCurrentMonth = endOfMonth(today);
    
    const filteredMembers = members.filter(member => {
      const memberId = getClientId(member, 'member'); // Usar o utilitário
      const status = member.StatusContrato?.toLowerCase() || '';
      const isDelinquent = status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado');
      return memberId && standardActiveMemberIds.has(memberId) && !isDelinquent;
    });
    filteredMembers.forEach(member => {
      const fimContratoStr = member.FimContrato;
      if (fimContratoStr) {
        const fimContratoDate = startOfDay(parse(fimContratoStr, 'dd/MM/yyyy', new Date()));
        
        if (fimContratoDate >= today && fimContratoDate <= endOfCurrentMonth) {
          expiringCount++;
        }
      }
    });
    return expiringCount;
  }, [members, standardActiveMemberIds]);

  const isLoading = isLoadingReceivables || isLoadingMembers;
  const hasError = isErrorReceivables || errorReceivables || errorMembers;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Análise de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {errorReceivables && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorReceivables.message}</p>}
          {errorMembers && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorMembers}</p>}
          <Button onClick={() => { refetchReceivables(); }} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Análise de Pagamentos de Alunos Ativos (Mês Atual)</h2>
        <Button onClick={() => refetchReceivables()} disabled={isLoadingReceivables} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingReceivables ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <MetricCard
          title="Alunos Ativos (Contratos)"
          value={totalActiveMembers.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle="Total de alunos com planos padrão (incl. anuais)"
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Alunos com Recebíveis"
          value={uniquePayingMembersCount.toLocaleString('pt-BR')}
          icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos ativos com pagamentos no período (excl. anuais)"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Ticket Médio Recebido"
          value={formatCurrency(averageTicketReceivables)}
          icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Valor médio por aluno ativo pagante (excl. anuais)"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Contratos a Vencer (Mês Atual)"
          value={contractsExpiringSoon.toLocaleString('pt-BR')}
          icon={<CalendarIcon className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Alunos adimplentes com contrato expirando até o final do mês (incl. anuais)"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Pagantes vs. Ativos"
          value={`${percentagePayingMembers.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Alunos com recebíveis em relação aos ativos (excl. anuais)"
          valueClassName={percentageColorClass}
          hasLeftBorderGradient
        />
      </div>
    </div>
  );
}