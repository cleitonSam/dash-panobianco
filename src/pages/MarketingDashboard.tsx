"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, MessageSquare, Eye, RefreshCw, Target, Wallet, LineChart as LineChartIcon, AlertCircle, Facebook } from 'lucide-react'; // Importar o ícone Facebook
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { MetricCard } from '@/components/MetricCard';
import { format, startOfMonth, endOfMonth, subMonths, addDays, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMktData } from '@/hooks/useMktData';
import { useBalanceData } from '@/hooks/useBalanceData';
import { useFollowersData } from '@/hooks/useFollowersData';
import { formatCurrency } from '@/utils/currency';
import { Select, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { NoAnimationSelectContent } from '@/components/NoAnimationSelectContent'; // Importar o novo componente
import { cn } from '@/lib/utils'; // Importar cn para combinar classes

const MarketingDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedCampaign, setSelectedCampaign] = useState<string>('Todos');

  const { 
    data: mktData, 
    isLoading: isLoadingMkt, 
    isError: isErrorMkt, 
    error: errorMkt, 
    refetch: refetchMkt 
  } = useMktData({
    startDate: dateRange.from ? startOfDay(dateRange.from) : undefined,
    endDate: dateRange.to ? startOfDay(dateRange.to) : undefined,
    campaignName: selectedCampaign,
  });

  const { 
    data: balanceData, 
    isLoading: isLoadingBalance, 
    isError: isErrorBalance, 
    error: errorBalance, 
    refetch: refetchBalance 
  } = useBalanceData();

  const { 
    data: followersData, 
    isLoading: isLoadingFollowers, 
    isError: isErrorFollowers, 
    error: errorFollowers, 
    refetch: refetchFollowers 
  } = useFollowersData();

  const allCampaigns = useMemo(() => {
    if (!mktData) return ['Todos'];
    const campaigns = new Set(mktData.map(item => item.campaign));
    return ['Todos', ...Array.from(campaigns).sort()];
  }, [mktData]);

  const { totalImpressions, totalReach, totalInvested, totalMessages, averageCostPerMessage } = useMemo(() => {
    if (!mktData || mktData.length === 0) {
      return { totalImpressions: 0, totalReach: 0, totalInvested: 0, totalMessages: 0, averageCostPerMessage: 0 };
    }

    const impressions = mktData.reduce((sum, item) => sum + item.impressions, 0);
    const reach = mktData.reduce((sum, item) => sum + item.reach, 0);
    const invested = mktData.reduce((sum, item) => sum + item.investedValue, 0);
    const messages = mktData.reduce((sum, item) => sum + item.messages, 0);
    const costPerMessage = messages > 0 ? invested / messages : 0;

    return {
      totalImpressions: impressions,
      totalReach: reach,
      totalInvested: invested,
      totalMessages: messages,
      averageCostPerMessage: costPerMessage,
    };
  }, [mktData]);

  const latestFollowers = useMemo(() => {
    if (!followersData || followersData.length === 0) return null;
    return followersData[followersData.length - 1]; // Last entry after sorting
  }, [followersData]);

  const followerGrowth = useMemo(() => {
    if (!followersData || followersData.length < 2) return null;
    const earliestFollowers = followersData[0].followers;
    const latestFollowersCount = followersData[followersData.length - 1].followers;
    const growth = latestFollowersCount - earliestFollowers;
    return growth;
  }, [followersData]);

  const followersChartData = useMemo(() => {
    if (!followersData) return [];
    return followersData.map(item => ({
      date: format(item.date, 'dd/MM'),
      followers: item.followers,
    }));
  }, [followersData]);

  const campaignInvestmentChartData = useMemo(() => {
    if (!mktData) return [];
    const investmentByCampaign = mktData.reduce((acc, item) => {
      acc[item.campaign] = (acc[item.campaign] || 0) + item.investedValue;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(investmentByCampaign)
      .map(([campaign, investedValue]) => ({ campaign, investedValue }))
      .sort((a, b) => b.investedValue - a.investedValue)
      .slice(0, 10); // Top 10 campaigns
  }, [mktData]);

  const handleRefreshAll = () => {
    refetchMkt();
    refetchBalance();
    refetchFollowers();
  };

  const isLoading = isLoadingMkt || isLoadingBalance || isLoadingFollowers;
  const hasError = isErrorMkt || isErrorBalance || isErrorFollowers;
  const errorMessage = errorMkt?.message || errorBalance?.message || errorFollowers?.message;

  if (isLoading && !hasError) { // Only show full skeleton on initial load or if no error
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
          <Skeleton className="h-[140px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <AlertCircle className="h-12 w-12 text-[hsl(var(--danger-color))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Erro ao carregar os dados de Marketing</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md text-center">
          {errorMessage}
        </p>
        <Button onClick={handleRefreshAll} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Dashboard de Marketing</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleRefreshAll} variant="outline" size="sm" disabled={isLoading} className="border-[hsl(var(--border-color))] bg-[hsl(var(--input))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary-black))] hover:text-[hsl(var(--accent-turquoise))]">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="sm"
            className="bg-blue-700 text-white hover:bg-blue-800" // Estilo para o botão do Facebook
          >
            <a 
              href="https://pt-br.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=596622933535968" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Facebook className="mr-2 h-4 w-4" />
              Biblioteca de Anúncios
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <DateRangeFilter
          dateRange={dateRange}
          onDateChange={setDateRange}
          presets={[
            { label: 'Mês Atual', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
            { label: 'Mês Passado', range: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } },
          ]}
          disabled={isLoadingMkt}
        />
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign} disabled={isLoadingMkt}>
          <SelectTrigger className={cn(
            "w-[180px] bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md",
            "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
          )}>
            <SelectValue placeholder="Selecionar Campanha" />
          </SelectTrigger>
          <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] shadow-lg"> {/* Usando o novo componente */}
            {allCampaigns.map(campaign => (
              <SelectItem key={campaign} value={campaign}>{campaign}</SelectItem>
            ))}
          </NoAnimationSelectContent>
        </Select>
      </div>

      <Separator className="bg-[hsl(var(--border-color))]" />

      <h2 className="text-[hsl(var(--accent-silver))] text-3xl font-bold mb-8 pb-4 border-b-2 border-[hsl(var(--border-color))]">Outros Indicadores</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"> {/* Ajustado de gap-4 md:gap-6 para gap-3 md:gap-4 */}
        {isLoadingBalance ? (
          <Skeleton className="h-[140px]" />
        ) : (
          <MetricCard
            title="Saldo Disponível"
            value={balanceData ? formatCurrency(balanceData.balance) : 'N/A'}
            icon={<Wallet className="h-5 w-5 text-[hsl(var(--primary))]" />}
            subtitle={balanceData ? `Última atualização: ${format(balanceData.date, 'dd/MM/yyyy', { locale: ptBR })}` : 'Dados não disponíveis'}
            valueClassName="text-[hsl(var(--primary))]"
            hasLeftBorderGradient
          />
        )}

        {isLoadingFollowers ? (
          <Skeleton className="h-[140px]" />
        ) : (
          <MetricCard
            title="Seguidores"
            value={latestFollowers ? latestFollowers.followers.toLocaleString('pt-BR') : 'N/A'}
            icon={<Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
            subtitle={latestFollowers ? `Última consulta: ${format(latestFollowers.date, 'dd/MM/yyyy', { locale: ptBR })}` : 'Dados não disponíveis'}
            trend={followerGrowth !== null ? { value: followerGrowth, label: 'desde o início', isPercentage: false } : undefined}
            valueClassName="text-[hsl(var(--accent-turquoise))]"
            hasLeftBorderGradient
          />
        )}
      </div>

      <Separator className="my-8 bg-[hsl(var(--border-color))]" />

      <h2 className="text-[hsl(var(--accent-silver))] text-3xl font-bold mb-8 pb-4 border-b-2 border-[hsl(var(--border-color))]">Métricas Principais</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4"> {/* Ajustado de gap-4 md:gap-6 para gap-3 md:gap-4 */}
        {isLoadingMkt ? (
          <>
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
            <Skeleton className="h-[140px]" />
          </>
        ) : (
          <>
            <MetricCard
              title="Impressões"
              value={totalImpressions.toLocaleString('pt-BR')}
              icon={<Eye className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
              subtitle="Total de visualizações das campanhas"
              hasLeftBorderGradient
            />
            <MetricCard
              title="Alcance"
              value={totalReach.toLocaleString('pt-BR')}
              icon={<Target className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
              subtitle="Pessoas únicas alcançadas"
              hasLeftBorderGradient
            />
            <MetricCard
              title="Valor Investido"
              value={formatCurrency(totalInvested)}
              icon={<DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />}
              subtitle="Custo total das campanhas"
              valueClassName="text-[hsl(var(--primary))]"
              hasLeftBorderGradient
            />
            <MetricCard
              title="Mensagens"
              value={totalMessages.toLocaleString('pt-BR')}
              icon={<MessageSquare className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
              subtitle="Interações/conversas geradas"
              hasLeftBorderGradient
            />
            <MetricCard
              title="Custo por Mensagem"
              value={formatCurrency(averageCostPerMessage)}
              icon={<TrendingUp className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
              subtitle="Custo médio por interação"
              hasLeftBorderGradient
            />
          </>
        )}
      </div>

      <Separator className="my-8 bg-[hsl(var(--border-color))]" />

      <h2 className="text-[hsl(var(--accent-silver))] text-3xl font-bold mb-8 pb-4 border-b-2 border-[hsl(var(--border-color))]">Análise de Campanhas</h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"> {/* Ajustado de gap-6 para gap-4 */}
        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[hsl(var(--foreground))]">Investimento por Campanha (Top 10)</CardTitle>
            <DollarSign className="h-5 w-5 text-[hsl(var(--primary))]" />
          </CardHeader>
          <CardContent>
            {isLoadingMkt ? (
              <Skeleton className="h-[350px] w-full" />
            ) : campaignInvestmentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={campaignInvestmentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30 stroke-[hsl(var(--border-color))]" />
                  <XAxis 
                    dataKey="campaign" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Valor Investido']}
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
                    dataKey="investedValue" 
                    fill="hsl(var(--accent-turquoise))" 
                    name="Valor Investido"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-8">Nenhum dado de investimento por campanha disponível para o período.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[hsl(var(--foreground))]">Histórico de Seguidores</CardTitle>
            <LineChartIcon className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
          </CardHeader>
          <CardContent>
            {isLoadingFollowers ? (
              <Skeleton className="h-[350px] w-full" />
            ) : followersChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={followersChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30 stroke-[hsl(var(--border-color))]" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
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
                  <Line type="monotone" dataKey="followers" stroke="hsl(var(--accent-turquoise))" activeDot={{ r: 8 }} name="Seguidores" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-[hsl(var(--muted-foreground))] py-8">Nenhum dado histórico de seguidores disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketingDashboard;