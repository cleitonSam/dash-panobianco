"use client";

import React from 'react';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash, CheckCircle, Clock, XCircle, PlayCircle, CalendarIcon, User, Tag, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TaskForm } from './TaskForm';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
}

const RESPONSIBLE_ROLES = ['TI', 'MARKETING', 'DESIGN', 'PERFORMER'];

export const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdated, onTaskDeleted }) => {
  const { updateTask, deleteTask } = useTasks();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Adicionado useEffect para fechar o Dialog ao desmontar
  React.useEffect(() => {
    return () => {
      setIsEditDialogOpen(false);
    };
  }, []);

  const getResponsibleDisplayName = (responsibleId: string | null) => {
    if (!responsibleId) return 'N/A';
    if (RESPONSIBLE_ROLES.includes(responsibleId)) {
      return responsibleId;
    }
    return responsibleId;
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'Pendente': return 'bg-[hsl(var(--pending-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--pending-color))]/90';
      case 'Em Progresso': return 'bg-[hsl(var(--warning-color))] text-[hsl(var(--primary-black))] hover:bg-[hsl(var(--warning-color))]/90';
      case 'Concluído': return 'bg-[hsl(var(--success-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--success-color))]/90';
      case 'Cancelado': return 'bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90';
      default: return 'bg-[hsl(var(--pending-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--pending-color))]/90';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'Pendente': return <Clock className="h-3 w-3 text-[hsl(var(--accent-white))]" />;
      case 'Em Progresso': return <PlayCircle className="h-3 w-3 text-[hsl(var(--primary-black))]" />;
      case 'Concluído': return <CheckCircle className="h-3 w-3 text-[hsl(var(--accent-white))]" />;
      case 'Cancelado': return <XCircle className="h-3 w-3 text-[hsl(var(--accent-white))]" />;
      default: return null;
    }
  };

  const handleUpdateTask = async (values: any) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        ...values,
        due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : null,
      });
      setIsEditDialogOpen(false);
      onTaskUpdated?.();
    } catch (error) {
      // Erro já é tratado no hook useTasks
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log(`Attempting to delete task with ID: ${taskId}`); // Adicionado log aqui
    try {
      await deleteTask.mutateAsync(taskId);
      onTaskDeleted?.();
    } catch (error) {
      // Erro já é tratado no hook useTasks
    }
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-[hsl(var(--foreground))]">
            {task.task_description}
          </CardTitle>
          <CardDescription className="text-xs text-[hsl(var(--muted-foreground))]">
            Criado em {format(parseISO(task.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="hover:bg-[hsl(var(--secondary-black))]">
              <Edit className="mr-2 h-4 w-4 text-[hsl(var(--accent-turquoise))]" /> Editar
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-[hsl(var(--secondary-black))]">
                  <Trash className="mr-2 h-4 w-4 text-[hsl(var(--danger-color))]" /> Excluir
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[hsl(var(--foreground))]">Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[hsl(var(--muted-foreground))]">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente esta tarefa.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 hover:text-[hsl(var(--accent-white))] border-[hsl(var(--border-color))]">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between pt-4">
        <div className="grid gap-2 text-sm">
          {task.client && (
            <div className="flex items-center text-[hsl(var(--muted-foreground))]">
              <Briefcase className="mr-2 h-4 w-4 text-[hsl(var(--accent-silver))]" />
              <span className="font-medium text-[hsl(var(--foreground))]">{task.client}</span>
            </div>
          )}
          {task.project_campaign && (
            <div className="flex items-center text-[hsl(var(--muted-foreground))]">
              <Tag className="mr-2 h-4 w-4 text-[hsl(var(--accent-silver))]" />
              <span className="font-medium text-[hsl(var(--foreground))]">{task.project_campaign}</span>
            </div>
          )}
          <div className="flex items-center text-[hsl(var(--muted-foreground))]">
            <User className="mr-2 h-4 w-4 text-[hsl(var(--accent-silver))]" />
            <span className="font-medium text-[hsl(var(--foreground))]">{getResponsibleDisplayName(task.responsible_id)}</span>
          </div>
          <div className="flex items-center">
            <Badge className={getStatusBadgeVariant(task.status)}>
              {getStatusIcon(task.status)}
              {task.status}
            </Badge>
          </div>
          {task.due_date && (
            <div className={cn(
              "flex items-center text-[hsl(var(--muted-foreground))]",
              parseISO(task.due_date) < new Date() && task.status !== 'Concluído' && "text-[hsl(var(--danger-color))] font-semibold"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              Prazo: {format(parseISO(task.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}
          {task.observations && (
            <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] line-clamp-3">
              <span className="font-semibold">Obs:</span> {task.observations}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog key={task.id} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))]">Editar Tarefa</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))]">Faça as alterações necessárias na tarefa.</DialogDescription>
          </DialogHeader>
          <TaskForm
            key={task.id}
            defaultValues={{
              id: task.id, // Certifique-se de que o ID está sendo passado
              client: task.client || '',
              project_campaign: task.project_campaign || '',
              task_description: task.task_description,
              responsible_id: task.responsible_id || '',
              status: task.status,
              due_date: task.due_date, // <-- Passando a string diretamente
              observations: task.observations || '',
            }}
            onSubmit={(values) => handleUpdateTask(values)}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};