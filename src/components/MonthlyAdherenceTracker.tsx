import React, { useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, TrendingUp, Save, RefreshCw } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format, startOfMonth, subMonths, parseISO, startOfDay } from 'date-fns'; // Importar startOfDay
import { ptBR } from 'date-fns/locale';
import { calculateAdimplentesCount } from '@/utils/memberCalculations';
import { GymLocationMap } from './GymLocationMap'; // Importar o novo componente de mapa

interface MonthlyAdherenceTrackerProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
}

interface MonthlyStats {
  id: string;
  month_start_date: string;
  adimplentes_count: number;
  created_at: string;
}

export const MonthlyAdherenceTracker: React.FC<MonthlyAdherenceTrackerProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
}) => {
  const queryClient = useQueryClient();

  // Fetch historical monthly stats
  const { data: monthlyStats, isLoading: isLoadingStats, isError: isErrorStats, error: statsError, refetch: refetchStats } = useQuery<MonthlyStats[]>({
    queryKey: ['monthly_member_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_member_stats')
        .select('*')
        .order('month_start_date', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Calculate current adimplentes count
  const currentAdimplentesCount = useMemo(() => {
    if (isLoadingMembers || !members) return 0;
    return calculateAdimplentesCount(members);
  }, [members, isLoadingMembers]);

  // Find the latest and second-to-latest saved stats
  const latestSavedStat = useMemo(() => {
    if (!monthlyStats || monthlyStats.length === 0) return null;
    // The query orders by month_start_date ascending, so the last one is the latest.
    return monthlyStats[monthlyStats.length - 1];
  }, [monthlyStats]);

  const secondToLatestSavedStat = useMemo(() => {
    if (!monthlyStats || monthlyStats.length < 2) return null;
    // Find the second to last entry that is not the same month as the latest
    const latestMonth = latestSavedStat ? format(parseISO(latestSavedStat.month_start_date), 'yyyy-MM') : null;
    
    for (let i = monthlyStats.length - 2; i >= 0; i--) {
        const currentMonth = format(parseISO(monthlyStats[i].month_start_date), 'yyyy-MM');
        if (currentMonth !== latestMonth) {
            return monthlyStats[i];
        }
    }
    return null;
  }, [monthlyStats, latestSavedStat]);


  const lastSavedCount = latestSavedStat?.adimplentes_count;
  const lastSavedMonthDate = latestSavedStat ? parseISO(latestSavedStat.month_start_date) : startOfMonth(new Date());
  const previousSavedCount = secondToLatestSavedStat?.adimplentes_count;

  // Calculate growth from previous month's saved data
  const growthFromPreviousMonth = useMemo(() => {
    if (lastSavedCount === undefined || previousSavedCount === undefined || previousSavedCount === 0) {
      return null;
    }
    const growth = ((lastSavedCount - previousSavedCount) / previousSavedCount) * 100;
    return growth.toFixed(1);
  }, [lastSavedCount, previousSavedCount]);


  // Prepare data for the chart (kept for potential future use, but not rendered)
  const chartData = useMemo(() => {
    if (!monthlyStats) return [];
    return monthlyStats.map(stat => ({
      month: format(parseISO(stat.month_start_date), 'MMM/yy', { locale: ptBR }),
      adimplentes: stat.adimplentes_count,
    }));
  }, [monthlyStats]);

  // Mutation to save monthly stats via Edge Function
  const saveMonthlyStatsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('save-monthly-stats');
      if (error) {
        throw new Error(error.message);
      }
      if (data?.error) {
        throw new Error(data.details || data.error);
      }
      return data;
    },
    onSuccess: (data) => {
      showSuccess(data.message || "Contagem de adimplentes salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['monthly_member_stats'] }); // Refetch stats after saving
    },
    onError: (error) => {
      showError(`Falha ao salvar contagem de adimplentes: ${error.message}`);
    },
  });

  const handleSaveMonthlyStats = () => {
    saveMonthlyStatsMutation.mutate();
  };

  const isLoading = isLoadingMembers || isLoadingStats || saveMonthlyStatsMutation.isPending;
  const hasError = errorMembers || isErrorStats || statsError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[350px] w-full" />
      </div>
    );
  }

  if (hasError) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados de Adesão Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMembers && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorMembers}</p>}
          {statsError && <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{statsError.message}</p>}
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['monthly_member_stats'] })} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Adesão Mensal</h2>
          <Button variant="ghost" size="icon" onClick={() => refetchStats()} title="Atualizar dados">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleSaveMonthlyStats}
          disabled={saveMonthlyStatsMutation.isPending || isLoadingMembers}
          className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
        >
          <Save className={`mr-2 h-4 w-4 ${saveMonthlyStatsMutation.isPending ? 'animate-spin' : ''}`} />
          {saveMonthlyStatsMutation.isPending ? 'Salvando...' : 'Salvar Dados do Mês'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Adimplentes (Início do Mês)</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[hsl(var(--accent-silver))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">
              {lastSavedCount !== undefined ? lastSavedCount.toLocaleString('pt-BR') : 'N/A'}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Contagem salva em {format(lastSavedMonthDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Adimplentes (Atual)</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--primary))]">{currentAdimplentesCount.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Contagem atual de alunos adimplentes</p>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--primary))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[hsl(var(--primary))]">
              {growthFromPreviousMonth !== null ? `${growthFromPreviousMonth}%` : 'N/A'}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Em relação ao mês anterior ({previousSavedCount !== undefined ? previousSavedCount.toLocaleString('pt-BR') : 'N/A'})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mapa de Localização da Academia */}
      <GymLocationMap />
    </div>
  );
};