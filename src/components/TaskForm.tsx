"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form'; // Importação corrigida
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Loader2, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useTasks, Task } from '@/hooks/useTasks'; // Importar Task
import { showError } from '@/utils/toast';
import { NoAnimationSelectContent } from '@/components/NoAnimationSelectContent';

// Definindo as novas opções de responsável
const RESPONSIBLE_ROLES = ['TI', 'MARKETING', 'DESIGN', 'PERFORMER'];
const CLIENT_OPTIONS = ['Darks - Santo Andre', 'Darks - Maua']; // Novas opções de cliente

const taskFormSchema = z.object({
  client: z.string().optional(),
  project_campaign: z.string().optional(),
  task_description: z.string().min(1, { message: "A descrição da tarefa é obrigatória." }),
  responsible_id: z.string().min(1, { message: "O responsável é obrigatório." }),
  status: z.enum(['Pendente', 'Em Progresso', 'Concluído', 'Cancelado']).default('Pendente'),
  due_date: z.date().optional().nullable(),
  observations: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onTaskCreated?: () => void;
  onTaskUpdated?: () => void;
  defaultValues?: Partial<Task>; // Alterado para Partial<Task> para incluir 'id'
  isEditing?: boolean;
  onSubmit?: (values: TaskFormValues) => void;
}

// Função auxiliar para analisar valores de data
const parseDateValue = (value: string | Date | undefined | null): Date | undefined => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' && value) {
    try {
      return parseISO(value);
    } catch (e) {
      console.error("Erro ao analisar data string:", value, e);
      return undefined;
    }
  }
  return undefined;
};

export const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreated, onTaskUpdated, defaultValues, isEditing = false, onSubmit: parentOnSubmit }) => {
  const { createTask, updateTask } = useTasks();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      client: '',
      project_campaign: '',
      task_description: '',
      responsible_id: '',
      status: 'Pendente',
      due_date: undefined,
      observations: '',
      ...defaultValues,
      // Usar a função auxiliar para garantir que due_date seja um objeto Date ou undefined
      due_date: parseDateValue(defaultValues?.due_date),
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        client: defaultValues.client || '',
        project_campaign: defaultValues.project_campaign || '',
        task_description: defaultValues.task_description || '',
        responsible_id: defaultValues.responsible_id || '',
        status: defaultValues.status || 'Pendente',
        // Usar a função auxiliar para garantir que due_date seja um objeto Date ou undefined
        due_date: parseDateValue(defaultValues.due_date),
        observations: defaultValues.observations || '',
      });
    }
  }, [defaultValues, form]);

  const handleInternalSubmit = async (values: TaskFormValues) => {
    if (parentOnSubmit) {
      parentOnSubmit(values);
      return;
    }

    const formattedValues = {
      ...values,
      due_date: values.due_date ? format(values.due_date, 'yyyy-MM-dd') : undefined,
    };

    try {
      if (isEditing && defaultValues?.id) {
        await updateTask.mutateAsync({
          id: defaultValues.id,
          ...formattedValues,
        });
        onTaskUpdated?.();
      } else {
        await createTask.mutateAsync(formattedValues);
        form.reset();
        onTaskCreated?.();
      }
    } catch (error) {
      // Erro já é tratado no hook useTasks
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Cliente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(
                    "w-full bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md text-[hsl(var(--foreground))]",
                    "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
                  )}>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                </FormControl>
                <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] shadow-lg text-[hsl(var(--text-color))]">
                  {CLIENT_OPTIONS.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </NoAnimationSelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="project_campaign"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Projeto / Campanha</FormLabel>
              <FormControl>
                <Input placeholder="Nome do projeto ou campanha" {...field} className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="task_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Tarefa</FormLabel>
              <FormControl>
                <Textarea placeholder="Descreva a tarefa" {...field} className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsible_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Responsável</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(
                    "w-full bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md text-[hsl(var(--foreground))]",
                    "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
                  )}>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                </FormControl>
                <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] shadow-lg text-[hsl(var(--text-color))]">
                  {RESPONSIBLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </NoAnimationSelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className={cn(
                    "w-full bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md text-[hsl(var(--foreground))]",
                    "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
                  )}>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] shadow-lg text-[hsl(var(--text-color))]">
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </NoAnimationSelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-[hsl(var(--foreground))]">Prazo</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md text-[hsl(var(--foreground))]",
                        !field.value && "text-[hsl(var(--muted-foreground))]",
                        "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-auto p-0 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] !animate-in !animate-out"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={(date) => {
                      field.onChange(date);
                    }}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Adicione observações" {...field} className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createTask.isPending || updateTask.isPending} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
          {isEditing ? (
            updateTask.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )
          ) : (
            createTask.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )
          )}
          {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
        </Button>
      </form>
    </Form>
  );
};