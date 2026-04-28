"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Loader2, AlertCircle, Gift, Sparkles, PlusCircle, MessageSquareText } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isToday, isAfter, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCelebrations, Celebration } from '@/hooks/useCelebrations';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { TaskForm } from '@/components/TaskForm';
import { TaskList } from '@/components/TaskList';
import { useTasks, Task } from '@/hooks/useTasks';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NoAnimationSelectContent } from '@/components/NoAnimationSelectContent';

const RESPONSIBLE_ROLES = ['TI', 'MARKETING', 'DESIGN', 'PERFORMER'];
const TASK_STATUSES = ['Pendente', 'Em Progresso', 'Concluído', 'Cancelado'];

const Tasks: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: celebrations, isLoading, isError, error, refetch } = useCelebrations();
  const { fetchTasks } = useTasks();

  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [prefilledTaskData, setPrefilledTaskData] = useState<any | undefined>(undefined);

  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'Todos'>('Todos');
  const [responsibleFilter, setResponsibleFilter] = useState<string | 'Todos'>('Todos');

  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);

  const celebrationsToday = React.useMemo(() => {
    if (!celebrations) return [];
    return celebrations.filter(c => isToday(c.date));
  }, [celebrations]);

  const upcomingCelebrations = React.useMemo(() => {
    if (!celebrations) return [];
    return celebrations
      .filter(c => isAfter(startOfDay(c.date), today) && startOfDay(c.date) <= thirtyDaysFromNow)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [celebrations, today, thirtyDaysFromNow]);

  const modifiers = React.useMemo(() => {
    if (!celebrations) return {};
    const datesWithCelebrations = celebrations.map(c => c.date);
    return {
      celebration: datesWithCelebrations,
    };
  }, [celebrations]);

  const modifiersClassNames = {
    celebration: "bg-[hsl(var(--accent-turquoise))] text-[hsl(var(--accent-white))] rounded-full",
  };

  const handleTaskCreated = () => {
    setIsNewTaskDialogOpen(false);
    setPrefilledTaskData(undefined);
    fetchTasks().refetch();
  };

  const handleTaskUpdated = () => {
    fetchTasks().refetch();
  };

  const handleTaskDeleted = () => {
    fetchTasks().refetch();
  };

  const handleCreatePostTask = (celebration: Celebration) => {
    setPrefilledTaskData({
      task_description: `Criar post para ${celebration.description}`,
      responsible_id: 'MARKETING',
      due_date: celebration.date,
      status: 'Pendente',
      project_campaign: `Comemoração: ${celebration.description}`,
    });
    setIsNewTaskDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-96 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <AlertCircle className="h-12 w-12 text-[hsl(var(--danger-color))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Erro ao Carregar Comemorações</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md text-center">{error?.message}</p>
        <Button onClick={() => refetch()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Gestão de Tarefas e Comemorações</h1>
        <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setPrefilledTaskData(undefined)} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
            <DialogHeader>
              <DialogTitle className="text-[hsl(var(--foreground))]">Criar Nova Tarefa</DialogTitle>
              <DialogDescription className="text-[hsl(var(--muted-foreground))]">Preencha os detalhes para adicionar uma nova tarefa.</DialogDescription>
            </DialogHeader>
            <TaskForm onTaskCreated={handleTaskCreated} defaultValues={prefilledTaskData} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--foreground))]">Painel de Tarefas</CardTitle>
              <CardDescription className="text-[hsl(var(--muted-foreground))]">Visualize, filtre e gerencie todas as suas tarefas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 p-4 bg-[hsl(var(--secondary-black))] rounded-lg">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-[hsl(var(--background))] border-[hsl(var(--input))] shadow-md">
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] shadow-lg">
                    <SelectItem value="Todos">Todos os Status</SelectItem>
                    {TASK_STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </NoAnimationSelectContent>
                </Select>
                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                  <SelectTrigger className="w-[180px] bg-[hsl(var(--background))] border-[hsl(var(--input))] shadow-md">
                    <SelectValue placeholder="Filtrar por Responsável" />
                  </SelectTrigger>
                  <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] shadow-lg">
                    <SelectItem value="Todos">Todos os Responsáveis</SelectItem>
                    {RESPONSIBLE_ROLES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </NoAnimationSelectContent>
                </Select>
              </div>
              <TaskList
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                statusFilter={statusFilter}
                responsibleFilter={responsibleFilter}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                <Sparkles className="h-5 w-5 text-[hsl(var(--warning-color))]" />
                Comemorações de Hoje ({format(today, "dd 'de' MMMM", { locale: ptBR })})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {celebrationsToday.length > 0 ? (
                <ul className="space-y-3">
                  {celebrationsToday.map((c, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 p-2 bg-[hsl(var(--muted))] rounded-md shadow-sm">
                      <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-[hsl(var(--accent-turquoise))] flex-shrink-0" />
                        <span className="text-[hsl(var(--foreground))] font-medium">{c.description}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleCreatePostTask(c)} className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]">
                        <MessageSquareText className="mr-2 h-4 w-4" /> Post
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))]">Nenhuma comemoração para hoje.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                <CalendarIcon className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
                Próximas Comemorações (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingCelebrations.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <ul className="space-y-3">
                    {upcomingCelebrations.map((c, index) => (
                      <li key={index} className="flex items-center justify-between gap-3 p-3 bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] rounded-md shadow-sm hover:bg-[hsl(var(--muted))] transition-colors">
                        <div className="flex items-center gap-3">
                          <Gift className="h-5 w-5 text-[hsl(var(--accent-turquoise))] flex-shrink-0" />
                          <div>
                            <p className="text-[hsl(var(--foreground))] font-medium">{c.description}</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              {format(c.date, "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleCreatePostTask(c)} className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]">
                          <MessageSquareText className="mr-2 h-4 w-4" /> Post
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))]">Nenhuma comemoração futura nos próximos 30 dias.</p>
              )}
            </CardContent>
          </Card>

          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
                <CalendarIcon className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
                Navegar no Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal mb-4 bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md",
                      !selectedDate && "text-[hsl(var(--muted-foreground))]",
                      "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] !animate-in !animate-out"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                    }}
                    initialFocus
                    locale={ptBR}
                    modifiers={modifiers}
                    modifiersClassNames={modifiersClassNames}
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <div className="mt-4 w-full">
                  <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--foreground))]">
                    Comemorações em {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}:
                  </h3>
                  {celebrations.filter(c => format(c.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).length > 0 ? (
                    <ul className="space-y-1 text-[hsl(var(--muted-foreground))]">
                      {celebrations.filter(c => format(c.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')).map((c, index) => (
                        <li key={index} className="flex items-center justify-between gap-2 p-2 bg-[hsl(var(--muted))] rounded-md shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-turquoise))]" />
                            {c.description}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleCreatePostTask(c)} className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]">
                            <MessageSquareText className="mr-2 h-4 w-4" /> Post
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[hsl(var(--muted-foreground))]">Nenhuma comemoração para esta data.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Tasks;