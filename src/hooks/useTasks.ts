"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "../components/SessionContextProvider";

export interface Task {
  id: string;
  created_at: string;
  client: string | null;
  project_campaign: string | null;
  task_description: string;
  responsible_id: string | null;
  status: 'Pendente' | 'Em Progresso' | 'Concluído' | 'Cancelado';
  due_date: string | null;
  observations: string | null;
  created_by: string | null;
}

interface CreateTaskPayload {
  client?: string;
  project_campaign?: string;
  task_description: string;
  responsible_id: string;
  status?: 'Pendente' | 'Em Progresso' | 'Concluído' | 'Cancelado';
  due_date?: string;
  observations?: string;
}

interface UpdateTaskPayload {
  id: string;
  client?: string;
  project_campaign?: string;
  task_description?: string;
  responsible_id?: string;
  status?: 'Pendente' | 'Em Progresso' | 'Concluído' | 'Cancelado';
  due_date?: string;
  observations?: string;
}

interface FetchTasksFilters {
  status?: Task['status'] | 'Todos';
  responsible_id?: string | 'Todos';
  page?: number;
  pageSize?: number;
}

export const useTasks = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  const fetchTasks = (filters: FetchTasksFilters = {}) => useQuery<{ tasks: Task[], totalCount: number }, Error>({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      const { page = 1, pageSize = 9 } = filters;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' });

      if (filters.status && filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }
      if (filters.responsible_id && filters.responsible_id !== 'Todos') {
        query = query.eq('responsible_id', filters.responsible_id);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }
      return { tasks: data || [], totalCount: count || 0 };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 1,
    onError: (error) => {
      showError(`Falha ao carregar as tarefas: ${error.message}`);
    },
  });

  const createTask = useMutation<Task, Error, CreateTaskPayload>({
    mutationFn: async (newTask) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...newTask, created_by: userId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const webhookUrl = import.meta.env.VITE_TASK_WEBHOOK_URL;
      console.log('DEBUG: VITE_TASK_WEBHOOK_URL para criação:', webhookUrl); // ADDED DEBUG LOG
      if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.trim() !== '') {
        try {
          const webhookPayload = {
            ...data,
            source: 'Darks Gym App - Task Creation',
            timestamp: new Date().toISOString()
          };
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
          });
          console.log('DEBUG: Webhook para criação de tarefa enviado com sucesso.'); // ADDED DEBUG LOG
        } catch (webhookError) {
          console.error('DEBUG: Erro ao enviar dados para o webhook (criação):', webhookError);
        }
      } else {
        console.warn('DEBUG: VITE_TASK_WEBHOOK_URL não está configurada ou está vazia para criação de tarefa. Webhook não enviado.'); // ADDED WARNING
      }

      showSuccess("Tarefa criada com sucesso!");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      showError(`Falha ao criar tarefa: ${error.message}`);
    },
  });

  const updateTask = useMutation<Task, Error, UpdateTaskPayload>({
    mutationFn: async (updatedTask) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { id, ...updates } = updatedTask;
      console.log(`DEBUG: Tentando atualizar tarefa com ID: ${id}, atualizações:`, updates);
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const webhookUrl = import.meta.env.VITE_TASK_WEBHOOK_URL;
      console.log('DEBUG: VITE_TASK_WEBHOOK_URL para atualização:', webhookUrl); // ADDED DEBUG LOG
      if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.trim() !== '') {
        try {
          const webhookPayload = {
            ...data, // Envia os dados da tarefa atualizada
            source: 'Darks Gym App - Task Update',
            timestamp: new Date().toISOString()
          };
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
          });
          console.log('DEBUG: Webhook para atualização de tarefa enviado com sucesso.'); // ADDED DEBUG LOG
        } catch (webhookError) {
          console.error('DEBUG: Erro ao enviar dados para o webhook (atualização):', webhookError);
        }
      } else {
        console.warn('DEBUG: VITE_TASK_WEBHOOK_URL não está configurada ou está vazia para atualização de tarefa. Webhook não enviado.'); // ADDED WARNING
      }

      showSuccess("Tarefa atualizada com sucesso!");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      showError(`Falha ao atualizar tarefa: ${error.message}`);
    },
  });

  const deleteTask = useMutation<void, Error, string>({
    mutationFn: async (taskId) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error("Supabase delete task error:", error);
        throw new Error(error.message);
      }
      showSuccess("Tarefa excluída com sucesso!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      showError(`Falha ao excluir tarefa: ${error.message}`);
    },
  });

  return {
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
};