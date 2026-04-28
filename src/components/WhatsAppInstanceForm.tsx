"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, Save, Image as ImageIcon, XCircle } from 'lucide-react'; // Adicionado Image e XCircle
import { useWhatsApp, WhatsAppInstance } from '@/hooks/useWhatsApp'; // Importar WhatsAppInstance
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Importar Avatar
import { cn } from '@/lib/utils';

const formSchema = z.object({
  instance_name: z.string().min(3, { message: "O nome da instância deve ter pelo menos 3 caracteres." }),
  phone: z.string().optional().nullable(), // Adicionado campo de telefone
  avatar: z.any().optional(), // Para o arquivo de imagem
});

type FormValues = z.infer<typeof formSchema>;

interface WhatsAppInstanceFormProps {
  onSuccess: () => void;
  defaultValues?: Partial<WhatsAppInstance>; // Para edição
  isEditing?: boolean;
}

export const WhatsAppInstanceForm: React.FC<WhatsAppInstanceFormProps> = ({ onSuccess, defaultValues, isEditing = false }) => {
  const { createInstance, updateInstance } = useWhatsApp();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultValues?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instance_name: defaultValues?.instance_name || "",
      phone: defaultValues?.phone || "",
      avatar: undefined,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        instance_name: defaultValues.instance_name || "",
        phone: defaultValues.phone || "",
        avatar: undefined, // Resetar o campo de arquivo
      });
      setAvatarPreview(defaultValues.avatar_url || null);
      setAvatarFile(null);
    }
  }, [defaultValues, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarFile(null);
      setAvatarPreview(defaultValues?.avatar_url || null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    form.setValue('avatar', null); // Indica que o avatar deve ser removido
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && defaultValues?.id) {
        await updateInstance.mutateAsync({
          instanceId: defaultValues.id,
          instance_name: values.instance_name,
          phone: values.phone,
          avatarFile: avatarFile === null && defaultValues.avatar_url ? null : avatarFile, // Passa null se foi removido e havia um URL
        });
      } else {
        await createInstance.mutateAsync({ instance_name: values.instance_name });
      }
      form.reset();
      setAvatarPreview(null);
      setAvatarFile(null);
      onSuccess();
    } catch (error) {
      // Error handled by hook
    }
  };

  const isSubmitting = createInstance.isPending || updateInstance.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-[hsl(var(--border-color))]">
            <AvatarImage src={avatarPreview || undefined} alt="Avatar da Instância" />
            <AvatarFallback className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <ImageIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={isSubmitting}
              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {avatarPreview ? 'Mudar Avatar' : 'Adicionar Avatar'}
            </Button>
            {avatarPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isSubmitting}
                className="bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90 border-[hsl(var(--danger-color))]"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Remover
              </Button>
            )}
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="instance_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[hsl(var(--foreground))]">Nome da Instância</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: WhatsApp Mauá, Suporte TI" 
                  {...field} 
                  className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isEditing && (
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[hsl(var(--foreground))]">Número de Telefone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="5511999999999" 
                    {...field} 
                    className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
        >
          {isSubmitting ? (
            <span key="loading-submit" className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Salvando...' : 'Criando...'}
            </span>
          ) : (
            <span key="default-submit" className="flex items-center">
              {isEditing ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Instância'}
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
};