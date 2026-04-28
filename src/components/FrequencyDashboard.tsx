"use client";

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, UserCheck, CalendarOff, Download, Clock, CalendarDays, UserX } from 'lucide-react';
import { format, parse, differenceInDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ExportToExcelButton } from './ExportToExcelButton';
import { MetricCard } from './MetricCard'; // Importar MetricCard

interface FrequencyDashboardProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
}

interface FrequencyMember {
  name: string;
  plan: string;
  lastEntry: string;
  daysSinceLastEntry: number | 'Grave';
}

export const FrequencyDashboard: React.FC<FrequencyDashboardProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
}) => {
  const { 
    processedMembers, 
    wellhubStats, 
    totalpassStats,
    gurupassStats, // NOVO: Adicionado Gurupass Stats
  } = useMemo(() => {
    if (isLoadingMembers || !members || members.length === 0) {
      return {
        processedMembers: [],
        wellhubStats: { today: 0, active: 0, absent: 0, grave: 0 },
        totalpassStats: { today: 0, active: 0, absent: 0, grave: 0 },
        gurupassStats: { today: 0, active: 0, absent: 0, grave: 0 }, // NOVO: Inicialização
      };
    }

    const today = startOfDay(new Date());
    
    const wellhubMembers = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('wellhub') || planName.includes('gympass');
    });

    const totalpassMembers = members.filter(member => {
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('totalpass');
    });
    
    const gurupassMembers = members.filter(member => { // NOVO: Filtrar Gurupass
      const planName = member.NomeContrato?.toLowerCase() || '';
      return planName.includes('gurupass');
    });

    const calculateStats = (memberList: any[]) => {
      let todayCount = 0;
      let oneToSevenDaysCount = 0;
      let overSevenDaysCount = 0;
      let graveCount = 0;
      const membersData: FrequencyMember[] = [];

      memberList.forEach(member => {
        const lastEntryString = member.UltimaEntrada;
        let daysSinceLastEntry: number | 'Grave' = 'Grave';
        let formattedLastEntry = 'N/A';

        if (lastEntryString) {
          try {
            const parsedDate = parse(lastEntryString, 'dd/MM/yyyy', new Date());
            daysSinceLastEntry = differenceInDays(today, startOfDay(parsedDate));
            formattedLastEntry = format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });

            if (daysSinceLastEntry === 0) {
              todayCount++;
            } else if (daysSinceLastEntry >= 1 && daysSinceLastEntry <= 7) {
              oneToSevenDaysCount++;
            } else if (daysSinceLastEntry > 7) {
              overSevenDaysCount++;
            }
          } catch (e) {
            graveCount++;
          }
        } else {
          graveCount++;
        }

        membersData.push({
          name: member.Nome,
          plan: member.NomeContrato,
          lastEntry: formattedLastEntry,
          daysSinceLastEntry: daysSinceLastEntry,
        });
      });

      // Sort: 'Grave' first, then 0 days, then by daysSinceLastEntry (ascending)
      membersData.sort((a, b) => {
        if (a.daysSinceLastEntry === 'Grave' && b.daysSinceLastEntry !== 'Grave') return -1;
        if (a.daysSinceLastEntry !== 'Grave' && b.daysSinceLastEntry === 'Grave') return 1;
        if (a.daysSinceLastEntry === 'Grave' && b.daysSinceLastEntry === 'Grave') return 0;
        
        const daysA = a.daysSinceLastEntry as number;
        const daysB = b.daysSinceLastEntry as number;

        if (daysA === 0 && daysB !== 0) return -1;
        if (daysA !== 0 && daysB === 0) return 1;
        
        return daysA - daysB;
      });

      return {
        membersData,
        stats: {
          today: todayCount,
          active: oneToSevenDaysCount,
          absent: overSevenDaysCount,
          grave: graveCount,
        }
      };
    };

    const wellhubResult = calculateStats(wellhubMembers);
    const totalpassResult = calculateStats(totalpassMembers);
    const gurupassResult = calculateStats(gurupassMembers); // NOVO: Calcular Gurupass stats
    
    // Combine all processed members for the main table (sorted)
    const allProcessedMembers = [...wellhubResult.membersData, ...totalpassResult.membersData, ...gurupassResult.membersData].sort((a, b) => {
        // Prioritize Grave, then Today, then sort by days ascending
        if (a.daysSinceLastEntry === 'Grave' && b.daysSinceLastEntry !== 'Grave') return -1;
        if (a.daysSinceLastEntry !== 'Grave' && b.daysSinceLastEntry === 'Grave') return 1;
        if (a.daysSinceLastEntry === 'Grave' && b.daysSinceLastEntry === 'Grave') return 0;
        
        const daysA = a.daysSinceLastEntry as number;
        const daysB = b.daysSinceLastEntry as number;

        if (daysA === 0 && daysB !== 0) return -1;
        if (daysA !== 0 && daysB === 0) return 1;
        
        return daysA - daysB;
    });


    return {
      processedMembers: allProcessedMembers,
      wellhubStats: wellhubResult.stats,
      totalpassStats: totalpassResult.stats,
      gurupassStats: gurupassResult.stats, // NOVO: Retornar Gurupass stats
    };
  }, [members, isLoadingMembers]);

  const totalMembers = processedMembers.length;

  if (isLoadingMembers) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (errorMembers) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Dados de Frequência</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorMembers}</p>
          <Button onClick={() => window.location.reload()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Wellhub / Gympass Metrics */}
      <h3 className="text-xl font-semibold text-[hsl(var(--foreground))]">Wellhub / Gympass ({wellhubStats.today + wellhubStats.active + wellhubStats.absent + wellhubStats.grave})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Wellhub Hoje"
          value={wellhubStats.today.toLocaleString('pt-BR')}
          icon={<UserCheck className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle="Alunos Wellhub que registraram entrada hoje"
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Wellhub Ativos (1-7 dias)"
          value={wellhubStats.active.toLocaleString('pt-BR')}
          icon={<CalendarDays className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos Wellhub que vieram nos últimos 1 a 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Wellhub Ausentes (>7 dias)"
          value={wellhubStats.absent.toLocaleString('pt-BR')}
          icon={<Clock className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Alunos Wellhub que não vêm há mais de 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Wellhub Frequência Grave"
          value={wellhubStats.grave.toLocaleString('pt-BR')}
          icon={<UserX className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Alunos Wellhub sem registro de última entrada"
          hasLeftBorderGradient
        />
      </div>

      {/* TotalPass Metrics */}
      <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] pt-4">TotalPass ({totalpassStats.today + totalpassStats.active + totalpassStats.absent + totalpassStats.grave})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="TotalPass Hoje"
          value={totalpassStats.today.toLocaleString('pt-BR')}
          icon={<UserCheck className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle="Alunos TotalPass que registraram entrada hoje"
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="TotalPass Ativos (1-7 dias)"
          value={totalpassStats.active.toLocaleString('pt-BR')}
          icon={<CalendarDays className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos TotalPass que vieram nos últimos 1 a 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="TotalPass Ausentes (>7 dias)"
          value={totalpassStats.absent.toLocaleString('pt-BR')}
          icon={<Clock className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Alunos TotalPass que não vêm há mais de 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="TotalPass Frequência Grave"
          value={totalpassStats.grave.toLocaleString('pt-BR')}
          icon={<UserX className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Alunos TotalPass sem registro de última entrada"
          hasLeftBorderGradient
        />
      </div>
      
      {/* Gurupass Metrics - NOVO */}
      <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] pt-4">Gurupass ({gurupassStats.today + gurupassStats.active + gurupassStats.absent + gurupassStats.grave})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Gurupass Hoje"
          value={gurupassStats.today.toLocaleString('pt-BR')}
          icon={<UserCheck className="h-5 w-5 text-[hsl(var(--primary))]" />}
          subtitle="Alunos Gurupass que registraram entrada hoje"
          valueClassName="text-[hsl(var(--primary))]"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Gurupass Ativos (1-7 dias)"
          value={gurupassStats.active.toLocaleString('pt-BR')}
          icon={<CalendarDays className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />}
          subtitle="Alunos Gurupass que vieram nos últimos 1 a 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Gurupass Ausentes (>7 dias)"
          value={gurupassStats.absent.toLocaleString('pt-BR')}
          icon={<Clock className="h-5 w-5 text-[hsl(var(--warning-color))]" />}
          subtitle="Alunos Gurupass que não vêm há mais de 7 dias"
          hasLeftBorderGradient
        />
        <MetricCard
          title="Gurupass Frequência Grave"
          value={gurupassStats.grave.toLocaleString('pt-BR')}
          icon={<UserX className="h-5 w-5 text-[hsl(var(--danger-color))]" />}
          subtitle="Alunos Gurupass sem registro de última entrada"
          hasLeftBorderGradient
        />
      </div>

      <Card className="glow-card mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--foreground))]">Frequência Detalhada Planos Parceiros ({totalMembers})</CardTitle>
            <CardDescription className="text-[hsl(var(--muted-foreground))]">
              Acompanhe os dias desde a última entrada de todos os alunos com planos parceiros (Wellhub, TotalPass, Gurupass).
            </CardDescription>
          </div>
          <ExportToExcelButton
            data={processedMembers}
            fileName="frequencia_planos_parceiros"
            buttonText="Exportar Frequência"
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
        </CardHeader>
        <CardContent>
          {processedMembers.length > 0 ? (
            <div className="rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] text-[hsl(var(--text-color))] max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-[hsl(var(--secondary-black))] sticky top-0">
                  <TableRow>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Nome do Aluno</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Plano</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Última Entrada</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Dias Sem Vir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedMembers.map((member, index) => (
                    <TableRow key={index} className="border-b border-[hsl(var(--border-color))] hover:bg-[hsl(var(--secondary-black))]/50">
                      <TableCell className="font-medium text-[hsl(var(--foreground))]">{member.name}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{member.plan}</TableCell>
                      <TableCell className="text-[hsl(var(--foreground))]">{member.lastEntry}</TableCell>
                      <TableCell 
                        className={
                          member.daysSinceLastEntry === 'Grave' ? 'text-[hsl(var(--danger-color))] font-semibold' :
                          member.daysSinceLastEntry === 0 ? 'text-[hsl(var(--primary))] font-semibold' :
                          (member.daysSinceLastEntry as number) > 7 ? 'text-[hsl(var(--danger-color))] font-semibold' :
                          (member.daysSinceLastEntry as number) > 3 ? 'text-[hsl(var(--warning-color))]' :
                          'text-[hsl(var(--accent-turquoise))]'
                        }
                      >
                        {member.daysSinceLastEntry === 'Grave' ? 'Grave' : `${member.daysSinceLastEntry} dias`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <UserCheck className="h-12 w-12 text-[hsl(var(--accent-turquoise))]" />
              <p className="mt-4 text-[hsl(var(--muted-foreground))]">Nenhum aluno Wellhub/TotalPass/Gurupass encontrado ou sem dados de entrada.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};