import React, { useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, parseCurrencyString } from '@/utils/currency';
import { MetricCard } from '@/components/MetricCard';
import { MonthlyAdherenceTracker } from '@/components/MonthlyAdherenceTracker';
import { GrossRevenueDashboard } from '@/components/GrossRevenueDashboard';
import { ReceivablesDashboard } from '@/components/ReceivablesDashboard';
import { ProspectsDashboard } from '@/components/ProspectsDashboard';
import { AnnualDashboard } from '@/components/AnnualDashboard';
import { PersonalDashboard } from '@/components/PersonalDashboard';
import { OnlineSalesDashboard } from '@/components/OnlineSalesDashboard';
import { RevenuePerContractChart } from '@/components/RevenuePerContractChart';
import { MembersPerContractChart } from '@/components/MembersPerContractChart';
import { PlanTypeChart } from '@/components/PlanTypeChart';
import { ContractStatusChart } from '@/components/ContractStatusChart';
import { DelinquentRevenueSummary } from '@/components/DelinquentRevenueSummary';
import { ExportToPdfButton } from '@/components/ExportToPdfButton';
import { ExportToExcelButton } from '@/components/ExportToExcelButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, Users, TrendingUp, RefreshCw, AlertCircle, CalendarIcon, ShoppingCart, Target, UserCheck, UserX, Award, Clock, BarChart3, Wallet, FileDown } from 'lucide-react';
import { useReceivables } from '@/hooks/useReceivables';
import { useProspects } from '@/hooks/useProspects';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { getClientId } from '@/utils/dataHelpers';
import { DelinquentMembersTable } from '@/components/DelinquentMembersTable';
import { FrequencyDashboard } from '@/components/FrequencyDashboard';
import { MemberRevenueSummary } from '@/components/MemberRevenueSummary';
import { calculateAdimplentesCount } from '@/utils/memberCalculations';
import { AdimplentesListDialog } from '@/components/AdimplentesListDialog';

interface DashboardPageProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  refetchMembers: () => void;
}

const Index: React.FC<DashboardPageProps> = ({ members, isLoadingMembers, errorMembers, refetchMembers }) => {
  const queryClient = useQueryClient();
  const [isAdimplentesDialogOpen, setIsAdimplentesDialogOpen] = useState(false);

  const currentMonthDateRange = {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  };
  const previousMonthDateRange = {
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  };

  const { data: receivablesDataCurrentMonth, isLoading: isLoadingReceivablesCurrentMonth, isFetching: isFetchingReceivablesCurrentMonth, error: errorReceivablesCurrentMonth, refetch: refetchReceivablesCurrentMonth } = useReceivables({
    startDate: format(currentMonthDateRange.from, 'yyyy-MM-dd'),
    endDate: format(currentMonthDateRange.to, 'yyyy-MM-dd'),
  });

  const { data: receivablesDataPreviousMonth, isLoading: isLoadingReceivablesPreviousMonth, isFetching: isFetchingReceivablesPreviousMonth, error: errorReceivablesPreviousMonth, refetch: refetchReceivablesPreviousMonth } = useReceivables({
    startDate: format(previousMonthDateRange.from, 'yyyy-MM-dd'),
    endDate: format(previousMonthDateRange.to, 'yyyy-MM-dd'),
  });

  const { data: prospectsData, isLoading: isLoadingProspects, isFetching: isFetchingProspects, error: errorProspects } = useProspects();

  const { data: prospectsDataPreviousMonth, isLoading: isLoadingProspectsPrevious, isFetching: isFetchingProspectsPrevious, error: errorProspectsPrevious } = useProspects({
    startDate: format(previousMonthDateRange.from, 'yyyy-MM-dd'),
    endDate: format(previousMonthDateRange.to, 'yyyy-MM-dd'),
  });

  const { data: monthlyStats, isLoading: isLoadingStats, isFetching: isFetchingStats, error: errorStats } = useQuery<any[], Error>({
    queryKey: ['monthly_member_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('monthly_member_stats').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const handleRefreshAll = () => {
    refetchMembers();
    queryClient.invalidateQueries({ queryKey: ['receivables'] });
    queryClient.invalidateQueries({ queryKey: ['prospects'] });
    queryClient.invalidateQueries({ queryKey: ['monthly_member_stats'] });
  };

  const nonStandardPlanKeywords = [
    'influenciador', 'combo', 'diaria', 'wellhub', 'totalpass',
    'total pass', 'gurupass', 'vip', 'gympass', 'cortesia',
    'teste', 'promocional', 'free', 'gratis',
  ];

  const { totalRevenue, totalMembers: totalStandardMembersCount } = useMemo(() => {
    if (!members) return { totalRevenue: 0, totalMembers: 0 };
    let revenue = 0;
    const standardMembers = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return !nonStandardPlanKeywords.some(keyword => planName.includes(keyword));
    });
    standardMembers.forEach(member => {
      const status = member.StatusContrato?.toLowerCase() || '';
      if (!status.includes('inadimplente') && !status.includes('vencido') && !status.includes('cancelado')) {
        let value = parseCurrencyString(member.ValorContrato);
        const contractName = member.NomeContrato?.toLowerCase() || '';
        if ((contractName.includes('recorrente') || contractName.includes('darsj promocional')) && value < 179.90) {
          value = 179.90;
        }
        revenue += value;
      }
    });
    return { totalRevenue: revenue, totalMembers: standardMembers.length };
  }, [members]);

  const onlineSalesUniqueCustomersCurrentMonthCount = useMemo(() => {
    if (!receivablesDataCurrentMonth) return 0;
    const onlineSales = receivablesDataCurrentMonth.filter(item => item.Origem?.toLowerCase() === 'venda on-line');
    const uniqueCustomerIds = new Set<string>();
    onlineSales.forEach(sale => {
      const clientId = getClientId(sale, 'receivable');
      if (clientId) uniqueCustomerIds.add(clientId);
    });
    return uniqueCustomerIds.size;
  }, [receivablesDataCurrentMonth]);

  const onlineSalesUniqueCustomersPreviousMonthCount = useMemo(() => {
    if (!receivablesDataPreviousMonth) return 0;
    const onlineSales = receivablesDataPreviousMonth.filter(item => item.Origem?.toLowerCase() === 'venda on-line');
    const uniqueCustomerIds = new Set<string>();
    onlineSales.forEach(sale => {
      const clientId = getClientId(sale, 'receivable');
      if (clientId) uniqueCustomerIds.add(clientId);
    });
    return uniqueCustomerIds.size;
  }, [receivablesDataPreviousMonth]);

  const totalTransactionsCurrentMonth = useMemo(() => {
    return receivablesDataCurrentMonth?.length || 0;
  }, [receivablesDataCurrentMonth]);

  const { totalActiveMembers, adimplentesMembersList, membersWithActiveStatus, delinquentMembersCount, delinquentPercentage } = useMemo(() => {
    if (!members) return { totalActiveMembers: 0, adimplentesMembersList: [], membersWithActiveStatus: 0, delinquentMembersCount: 0, delinquentPercentage: '0' };
    const filteredMembersForStandardPlans = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return !nonStandardPlanKeywords.some(keyword => planName.includes(keyword));
    });
    const totalActive = filteredMembersForStandardPlans.length;
    const adimplentes = filteredMembersForStandardPlans.filter(member => {
      const status = member.StatusContrato?.toLowerCase() || '';
      return status === 'ativo';
    });
    const activeStatusCount = adimplentes.length;
    let delinquentCount = 0;
    filteredMembersForStandardPlans.forEach(member => {
      const status = member.StatusContrato?.toLowerCase() || '';
      if (status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado')) delinquentCount++;
    });
    const percentage = totalActive > 0 ? ((delinquentCount / totalActive) * 100).toFixed(1) : '0';
    return {
      totalActiveMembers: totalActive,
      adimplentesMembersList: adimplentes,
      membersWithActiveStatus: activeStatusCount,
      delinquentMembersCount: delinquentCount,
      delinquentPercentage: percentage,
    };
  }, [members]);

  const { totalWellhub, totalTotalPass, totalGurupass } = useMemo(() => {
    if (!members) return { totalWellhub: 0, totalTotalPass: 0, totalGurupass: 0 };
    const totalWellhubCount = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('wellhub') || planName.includes('gympass');
    }).length;
    const totalTotalPassCount = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('totalpass') || planName.includes('total pass');
    }).length;
    const totalGurupassCount = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('gurupass');
    }).length;
    return { totalWellhub: totalWellhubCount, totalTotalPass: totalTotalPassCount, totalGurupass: totalGurupassCount };
  }, [members]);

  const keyMetricsRef = useRef<HTMLDivElement>(null);
  const prospectsDashboardRef = useRef<HTMLDivElement>(null);
  const delinquentRevenueSummaryRef = useRef<HTMLDivElement>(null);
  const grossRevenueDashboardRef = useRef<HTMLDivElement>(null);
  const receivablesDashboardRef = useRef<HTMLDivElement>(null);
  const annualDashboardRef = useRef<HTMLDivElement>(null);
  const personalDashboardRef = useRef<HTMLDivElement>(null);
  const onlineSalesDashboardRef = useRef<HTMLDivElement>(null);
  const revenuePerContractChartRef = useRef<HTMLDivElement>(null);
  const membersPerContractChartRef = useRef<HTMLDivElement>(null);
  const planTypeChartRef = useRef<HTMLDivElement>(null);
  const contractStatusChartRef = useRef<HTMLDivElement>(null);
  const frequencyDashboardRef = useRef<HTMLDivElement>(null);

  const chartRefs = [
    { id: 'grossRevenueDashboard', ref: grossRevenueDashboardRef },
    { id: 'receivablesDashboard', ref: receivablesDashboardRef },
    { id: 'annualDashboard', ref: annualDashboardRef },
    { id: 'personalDashboard', ref: personalDashboardRef },
    { id: 'onlineSalesDashboard', ref: onlineSalesDashboardRef },
    { id: 'revenuePerContractChart', ref: revenuePerContractChartRef },
    { id: 'membersPerContractChart', ref: membersPerContractChartRef },
    { id: 'planTypeChart', ref: planTypeChartRef },
    { id: 'contractStatusChart', ref: contractStatusChartRef },
    { id: 'prospectsDashboard', ref: prospectsDashboardRef },
  ];

  const isLoading = isLoadingMembers || isLoadingReceivablesCurrentMonth || isLoadingReceivablesPreviousMonth || isLoadingProspects || isLoadingStats || isLoadingProspectsPrevious;
  const isFetching = isLoadingMembers || isFetchingReceivablesCurrentMonth || isFetchingReceivablesPreviousMonth || isFetchingProspects || isFetchingStats || isFetchingProspectsPrevious;
  const hasError = errorMembers || errorReceivablesCurrentMonth || errorReceivablesPreviousMonth || errorProspects || errorStats || errorProspectsPrevious;
  const errorMessage = errorMembers || errorReceivablesCurrentMonth?.message || errorReceivablesPreviousMonth?.message || errorProspects?.message || errorStats?.message || errorProspectsPrevious?.message;

  if (isLoading && !isFetching) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:p-8">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--danger-color))]/15 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-[hsl(var(--danger-color))]" />
        </div>
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Erro ao carregar os dados</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md text-center">{errorMessage}</p>
        <Button onClick={handleRefreshAll} className="btn-gradient-primary">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[hsl(var(--background))]">
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="https://cdn.prod.website-files.com/67ec66139f8f56d61a1cd4c9/68a4974d9925b142d28aa8e5_Logo-Panobianco-original-claro.svg"
              alt="Panobianco Logo"
              className="h-10"
            />
            <div className="hidden sm:block h-8 w-px bg-[hsl(var(--border-color))]" />
            <div className="hidden sm:block">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Painel de Gestao</p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{format(new Date(), 'MMMM yyyy').replace(/^\w/, c => c.toUpperCase())}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleRefreshAll}
              variant="outline"
              size="sm"
              disabled={isFetching}
              className="border-[hsl(var(--border-color))] bg-[hsl(var(--secondary-black))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <div className="h-6 w-px bg-[hsl(var(--border-color))] hidden sm:block" />
            <ExportToPdfButton
              members={members || []}
              receivablesData={receivablesDataCurrentMonth || []}
              monthlyStats={monthlyStats || []}
              prospectsData={prospectsData || []}
              totalTransactionsCurrentMonth={totalTransactionsCurrentMonth || 0}
              totalPredictedRevenue={totalRevenue}
              chartRefs={chartRefs}
              className="btn-gradient-primary text-sm"
            />
            <ExportToExcelButton
              data={members}
              fileName="relatorio_alunos"
              buttonText="Alunos"
              disabled={isFetching}
              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border-color))] text-sm"
            />
            <ExportToExcelButton
              data={receivablesDataCurrentMonth}
              fileName="relatorio_recebiveis"
              buttonText="Recebiveis"
              disabled={isFetching}
              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border-color))] text-sm"
            />
            <ExportToExcelButton
              data={prospectsData}
              fileName="relatorio_prospects"
              buttonText="Prospects"
              disabled={isFetching}
              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border-color))] text-sm"
            />
          </div>
        </div>

        {/* Hidden frequency dashboard for PDF export */}
        <div
          ref={frequencyDashboardRef}
          className="absolute"
          style={{ left: '-9999px', top: '-9999px', width: '1200px' }}
        >
          <FrequencyDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full flex flex-wrap bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))] rounded-xl p-1 h-auto gap-1">
            <TabsTrigger value="overview" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <BarChart3 className="h-4 w-4 mr-1.5 hidden sm:block" />
              Visao Geral
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <Wallet className="h-4 w-4 mr-1.5 hidden sm:block" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="members" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <Users className="h-4 w-4 mr-1.5 hidden sm:block" />
              Alunos
            </TabsTrigger>
            <TabsTrigger value="delinquents" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--danger-color))] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--danger-color))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <UserX className="h-4 w-4 mr-1.5 hidden sm:block" />
              Inadimplentes
            </TabsTrigger>
            <TabsTrigger value="prospects" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <Target className="h-4 w-4 mr-1.5 hidden sm:block" />
              Prospects
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <CalendarIcon className="h-4 w-4 mr-1.5 hidden sm:block" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="frequency" className="flex-1 min-w-[100px] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] data-[state=active]:shadow-lg data-[state=active]:shadow-[hsl(var(--primary))]/20 text-[hsl(var(--muted-foreground))] rounded-lg py-2.5 text-xs sm:text-sm font-medium">
              <Clock className="h-4 w-4 mr-1.5 hidden sm:block" />
              Frequencia
            </TabsTrigger>
          </TabsList>

          {/* ── VISAO GERAL ── */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Metrics Grid */}
            <div ref={keyMetricsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <MemberRevenueSummary data={members || []} />

              <MetricCard
                title="Total de Alunos (Padrao)"
                value={totalActiveMembers.toLocaleString('pt-BR')}
                icon={<UserCheck className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--primary))]" />}
                subtitle="Total de alunos com planos padrao"
                valueClassName="text-[hsl(var(--primary))]"
                hasLeftBorderGradient
              />

              <AdimplentesListDialog
                isOpen={isAdimplentesDialogOpen}
                onClose={() => setIsAdimplentesDialogOpen(false)}
                members={adimplentesMembersList}
              />
              <MetricCard
                title="Adimplentes"
                value={membersWithActiveStatus.toLocaleString('pt-BR')}
                icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--success-color))]" />}
                subtitle="Alunos com status 'ativo'"
                valueClassName="text-[hsl(var(--success-color))]"
                hasLeftBorderGradient
                className="cursor-pointer hover:border-[hsl(var(--success-color))]/30"
                onClick={() => setIsAdimplentesDialogOpen(true)}
              />

              <MetricCard
                title="Ticket Medio"
                value={totalStandardMembersCount > 0 ? formatCurrency(totalRevenue / totalStandardMembersCount) : 'R$ 0'}
                icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--primary))]" />}
                subtitle="Valor medio por aluno"
                valueClassName="text-[hsl(var(--primary))]"
                hasLeftBorderGradient
              />

              <MetricCard
                title="Vendas Online"
                value={onlineSalesUniqueCustomersCurrentMonthCount.toLocaleString('pt-BR')}
                icon={<ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--primary))]" />}
                subtitle="Clientes unicos este mes"
                valueClassName="text-[hsl(var(--primary))]"
                hasLeftBorderGradient
              />

              <MetricCard
                title="Wellhub/Gympass"
                value={totalWellhub.toLocaleString('pt-BR')}
                icon={<Award className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--muted-foreground))]" />}
                subtitle="Alunos parceiros"
                valueClassName="text-[hsl(var(--foreground))]"
                hasLeftBorderGradient
              />

              <MetricCard
                title="TotalPass"
                value={totalTotalPass.toLocaleString('pt-BR')}
                icon={<Award className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--muted-foreground))]" />}
                subtitle="Alunos parceiros"
                valueClassName="text-[hsl(var(--foreground))]"
                hasLeftBorderGradient
              />

              <MetricCard
                title="Gurupass"
                value={totalGurupass.toLocaleString('pt-BR')}
                icon={<Award className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--muted-foreground))]" />}
                subtitle="Alunos parceiros"
                valueClassName="text-[hsl(var(--foreground))]"
                hasLeftBorderGradient
              />
            </div>

            {/* Inadimplencia Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--danger-color))]/15 flex items-center justify-center">
                  <UserX className="h-4 w-4 text-[hsl(var(--danger-color))]" />
                </div>
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">Inadimplencia</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  title="Inadimplentes"
                  value={delinquentMembersCount.toLocaleString('pt-BR')}
                  icon={<UserX className="h-4 w-4 md:h-5 md:w-5 text-[hsl(var(--danger-color))]" />}
                  subtitle={`${delinquentPercentage}% do total de ativos`}
                  valueClassName="text-[hsl(var(--danger-color))]"
                  hasLeftBorderGradient
                />
                <div ref={delinquentRevenueSummaryRef}>
                  <DelinquentRevenueSummary data={members || []} />
                </div>
              </div>
            </div>

            {/* Adesao Mensal */}
            <MonthlyAdherenceTracker members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} />
          </TabsContent>

          {/* ── FINANCEIRO ── */}
          <TabsContent value="financial" className="mt-6 space-y-6">
            <div ref={grossRevenueDashboardRef}>
              <GrossRevenueDashboard />
            </div>
            <div ref={receivablesDashboardRef}>
              <ReceivablesDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} />
            </div>
          </TabsContent>

          {/* ── ALUNOS ── */}
          <TabsContent value="members" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div ref={revenuePerContractChartRef}><RevenuePerContractChart data={members || []} /></div>
              <div ref={membersPerContractChartRef}><MembersPerContractChart data={members || []} /></div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div ref={planTypeChartRef}><PlanTypeChart data={members || []} /></div>
              <div ref={contractStatusChartRef}><ContractStatusChart data={members || []} /></div>
            </div>
          </TabsContent>

          {/* ── INADIMPLENTES ── */}
          <TabsContent value="delinquents" className="mt-6 space-y-6">
            <DelinquentMembersTable members={members || []} />
          </TabsContent>

          {/* ── PROSPECTS ── */}
          <TabsContent value="prospects" className="mt-6 space-y-6">
            <div ref={prospectsDashboardRef}>
              <ProspectsDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} />
            </div>
          </TabsContent>

          {/* ── PLANOS ── */}
          <TabsContent value="plans" className="mt-6">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-3">
              <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="glow-card hover:!transform-none px-5 py-4 rounded-xl text-base font-semibold data-[state=open]:rounded-b-none text-[hsl(var(--foreground))]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/15 flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <span>Analise de Planos Anuais</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 bg-[hsl(var(--card-bg))] rounded-b-xl border border-t-0 border-[hsl(var(--border-color))]">
                  <div ref={annualDashboardRef}>
                    <AnnualDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} receivablesData={receivablesDataCurrentMonth} isLoadingReceivables={isLoadingReceivablesCurrentMonth} errorReceivables={errorReceivablesCurrentMonth} refetchReceivables={refetchReceivablesCurrentMonth} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-none">
                <AccordionTrigger className="glow-card hover:!transform-none px-5 py-4 rounded-xl text-base font-semibold data-[state=open]:rounded-b-none text-[hsl(var(--foreground))]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/15 flex items-center justify-center">
                      <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <span>Analise de Planos Personal</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 bg-[hsl(var(--card-bg))] rounded-b-xl border border-t-0 border-[hsl(var(--border-color))]">
                  <div ref={personalDashboardRef}>
                    <PersonalDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} receivablesData={receivablesDataCurrentMonth} isLoadingReceivables={isLoadingReceivablesCurrentMonth} errorReceivables={errorReceivablesCurrentMonth} refetchReceivables={refetchReceivablesCurrentMonth} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-none">
                <AccordionTrigger className="glow-card hover:!transform-none px-5 py-4 rounded-xl text-base font-semibold data-[state=open]:rounded-b-none text-[hsl(var(--foreground))]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/15 flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-[hsl(var(--primary))]" />
                    </div>
                    <span>Analise de Vendas Online</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-6 bg-[hsl(var(--card-bg))] rounded-b-xl border border-t-0 border-[hsl(var(--border-color))]">
                  <div ref={onlineSalesDashboardRef}>
                    <OnlineSalesDashboard receivablesData={receivablesDataCurrentMonth} isLoadingReceivables={isLoadingReceivablesCurrentMonth} errorReceivables={errorReceivablesCurrentMonth} refetchReceivables={refetchReceivablesCurrentMonth} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* ── FREQUENCIA ── */}
          <TabsContent value="frequency" className="mt-6 space-y-6">
            <FrequencyDashboard members={members || []} isLoadingMembers={isLoadingMembers} errorMembers={errorMembers} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
