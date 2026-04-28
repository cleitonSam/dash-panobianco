"use client";

import React, { useState, useEffect } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from './TaskCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TaskListProps {
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  statusFilter?: Task['status'] | 'Todos';
  responsibleFilter?: string | 'Todos';
}

const TASKS_PER_PAGE = 9;

export const TaskList: React.FC<TaskListProps> = ({ onTaskUpdated, onTaskDeleted, statusFilter, responsibleFilter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { fetchTasks } = useTasks();

  const { data, isLoading: isLoadingTasks, isError: isErrorTasks, error: tasksError, refetch } = fetchTasks({
    status: statusFilter,
    responsible_id: responsibleFilter,
    page: currentPage,
    pageSize: TASKS_PER_PAGE,
  });

  const tasks = data?.tasks || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / TASKS_PER_PAGE);

  useEffect(() => {
    // Se o filtro mudar e a página atual for maior que o novo total de páginas, volte para a primeira página.
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [statusFilter, responsibleFilter, currentPage, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoadingTasks) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(TASKS_PER_PAGE)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (isErrorTasks) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader><CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Tarefas</CardTitle></CardHeader>
        <CardContent>
          <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{tasksError?.message}</p>
          <Button onClick={() => refetch()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className="flex items-center justify-center h-48 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <p className="text-[hsl(var(--muted-foreground))]">Nenhuma tarefa encontrada com os filtros aplicados.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdated={onTaskUpdated}
            onTaskDeleted={onTaskDeleted}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <CardFooter className="pt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Página {currentPage} de {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </>
  );
};