import React, { useMemo } from 'react';
import { useProspects } from '@/hooks/useProspects';
import { MetricCard } from './MetricCard';
import { Target, TrendingUp, RefreshCw, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { ExportToExcelButton } from './ExportToExcelButton';
import { getClientId } from '@/utils/dataHelpers'; // Importar do utilitário

interface ProspectsDashboardProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
}

export const ProspectsDashboard: React.FC<ProspectsDashboardProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
}) => {
  // Date ranges for current and previous months
  const currentMonthRange = {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  };
  const previousMonthRange = {
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
  };

  // Fetch data for current month
  const {
    data: prospectsDataCurrentMonth,
    isLoading: isLoadingProspectsCurrent,
    isError: isErrorProspectsCurrent,
    error: errorProspectsCurrent,
    refetch: refetchProspectsCurrent,
  } = useProspects({
    startDate: format(startOfDay(currentMonthRange.from), 'yyyy-MM-dd'),
    endDate: format(startOfDay(currentMonthRange.to), 'yyyy-MM-dd'),
  });

  // Fetch data for previous month
  const {
    data: prospectsDataPreviousMonth,
    isLoading: isLoadingProspectsPrevious,
    isError: isErrorProspectsPrevious,
    error: errorProspectsPrevious,
    refetch: refetchProspectsPrevious,
  } = useProspects({
    startDate: format(startOfDay(previousMonthRange.from), 'yyyy-MM-dd'),
    endDate: format(startOfDay(previousMonthRange.to), 'yyyy-MM-dd'),
  });

  const nonStandardProspectConversionKeywords = [
    'influenciador',
    'personal', // Manter exclusão de 'personal' para conversão de prospects, se for um tipo de plano diferente
    'combo 3 diárias',
    'wellhub',
    'totalpass',
    'total pass', // Para variações
    'gurupass',
    'vip',
    'gympass',
    'cortesia',
    'teste',
    'promocional',
    'free',
    'gratis',
  ];

  const standardMemberIds = useMemo(() => {
    if (!members) return new Set<string>();
    const ids = new Set<string>();
    members.forEach(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      const isStandard = !nonStandardProspectConversionKeywords.some(keyword => planName.includes(keyword));
      if (isStandard) {
        const clientId = getClientId(member, 'member'); // Usar o utilitário
        if (clientId) ids.add(clientId);
      }
    });
    return ids;
  }, [members]);

  const calculateConversions = (prospects: any[] | undefined) => {
    if (!prospects || !standardMemberIds) return [];
    return prospects.filter(prospect => {
      const prospectId = getClientId(prospect, 'prospect'); // Usar o utilitário
      return prospectId && standardMemberIds.has(prospectId);
    });
  };

  const convertedProspectsCurrentMonth = useMemo(() => calculateConversions(prospectsDataCurrentMonth), [prospectsDataCurrentMonth, standardMemberIds]);
  const convertedProspectsPreviousMonth = useMemo(() => calculateConversions(prospectsDataPreviousMonth), [prospectsDataPreviousMonth, standardMemberIds]);

  const totalProspectsCurrentMonth = prospectsDataCurrentMonth?.length || 0;
  const totalProspectsPreviousMonth = prospectsDataPreviousMonth?.length || 0;

  const conversionRateCurrentMonth = totalProspectsCurrentMonth > 0 ? (convertedProspectsCurrentMonth.length / totalProspectsCurrentMonth) * 100 : 0;
  const conversionRatePreviousMonth = totalProspectsPreviousMonth > 0 ? (convertedProspectsPreviousMonth.length / totalProspectsPreviousMonth) * 100 : 0;

  const handleRefresh = () => {
    refetchProspectsCurrent();
    refetchProspectsPrevious();
  };

  const isLoading = isLoadingProspectsCurrent || isLoadingProspectsPrevious || isLoadingMembers;
  const hasError = isErrorProspectsCurrent || isErrorProspectsPrevious || errorMembers;
  const error = errorProspectsCurrent || errorProspectsPrevious || (errorMembers ? new Error(errorMembers) : null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-[180px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <CardHeader><CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados de Oportunidades</CardTitle></CardHeader>
        <CardContent>
          {error && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{error.message}</p>}
          <Button onClick={handleRefresh} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Oportunidades e Conversão</h2>
        <Button onClick={handleRefresh} disabled={isLoading} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Oportunidades - Mês Atual</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Oportunidades (Mês Atual)"
            value={totalProspectsCurrentMonth.toLocaleString('pt-BR')}
            icon={<Target className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
            subtitle={`Total de prospects registrados este mês`}
            hasLeftBorderGradient
          />
          <MetricCard
            title="Conversões (Mês Atual)"
            value={convertedProspectsCurrentMonth.length.toLocaleString('pt-BR')}
            icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--primary))]" />}
            subtitle="Prospects que se tornaram alunos (planos padrão)"
            valueClassName="text-[hsl(var(--primary))]"
            hasLeftBorderGradient
          />
          <MetricCard
            title="Taxa de Conversão (Mês Atual)"
            value={`${conversionRateCurrentMonth.toFixed(1)}%`}
            icon={<Percent className="h-5 w-5 text-[hsl(var(--primary))]" />}
            subtitle={`Comparado a ${conversionRatePreviousMonth.toFixed(1)}% no mês passado`}
            valueClassName="text-[hsl(var(--primary))]"
            hasLeftBorderGradient
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <ExportToExcelButton
            data={prospectsDataCurrentMonth}
            fileName="oportunidades_mes_atual"
            buttonText="Baixar Oportunidades (Mês Atual)"
            disabled={prospectsDataCurrentMonth?.length === 0}
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
          <ExportToExcelButton
            data={convertedProspectsCurrentMonth}
            fileName="convertidos_mes_atual"
            buttonText="Baixar Convertidos (Mês Atual)"
            disabled={convertedProspectsCurrentMonth.length === 0}
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
        </div>
      </div>

      <Separator className="my-6 bg-[hsl(var(--border-color))]" />

      <div>
        <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Oportunidades - Mês Passado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Oportunidades (Mês Passado)"
            value={totalProspectsPreviousMonth.toLocaleString('pt-BR')}
            icon={<Target className="h-5 w-5 text-[hsl(var(--accent-silver))]" />}
            subtitle={`Total de prospects registrados no mês anterior`}
            hasLeftBorderGradient
          />
          <MetricCard
            title="Conversões (Mês Passado)"
            value={convertedProspectsPreviousMonth.length.toLocaleString('pt-BR')}
            icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--accent-silver))]" />}
            subtitle="Prospects que se tornaram alunos (planos padrão)"
            hasLeftBorderGradient
          />
          <MetricCard
            title="Taxa de Conversão (Mês Passado)"
            value={`${conversionRatePreviousMonth.toFixed(1)}%`}
            icon={<Percent className="h-5 w-5 text-[hsl(var(--accent-silver))]" />}
            subtitle="Taxa de conversão finalizada do mês anterior"
            hasLeftBorderGradient
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <ExportToExcelButton
            data={prospectsDataPreviousMonth}
            fileName="oportunidades_mes_passado"
            buttonText="Baixar Oportunidades (Mês Passado)"
            disabled={prospectsDataPreviousMonth?.length === 0}
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
          <ExportToExcelButton
            data={convertedProspectsPreviousMonth}
            fileName="convertidos_mes_passado"
            buttonText="Baixar Convertidos (Mês Passado)"
            disabled={convertedProspectsPreviousMonth.length === 0}
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
        </div>
      </div>
    </div>
  );
};

export default ProspectsDashboard;