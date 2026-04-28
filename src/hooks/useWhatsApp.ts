"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";
import { v4 as uuidv4 } from 'uuid'; // Importar uuid para gerar nomes de arquivo únicos

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_name: string;
  phone: string | null;
  qr_code_base64: string | null;
  pairing_code: string | null;
  status: 'disconnected' | 'connecting' | 'connected';
  created_at: string;
  updated_at: string;
  avatar_url: string | null; // NOVO: Adicionado avatar_url
}

interface ConnectInstancePayload {
  instanceId: string;
  phone?: string; // Optional phone for pairing code
}

interface SendMessagePayload {
  phone: string;
  message: string;
}

interface UpdateInstancePayload {
  instanceId: string;
  instance_name?: string;
  avatarFile?: File | null; // Para upload de imagem (null para remover)
  phone?: string | null;
}

export const useWhatsApp = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  // Fetch user's WhatsApp instances
  const fetchInstances = useQuery<WhatsAppInstance[], Error>({
    queryKey: ["whatsappInstances", userId],
    queryFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 10, // Cache por 10 segundos para manter o status atualizado
    refetchInterval: 1000 * 15, // Refetch a cada 15 segundos para status de conexão
    onError: (error) => {
      showError(`Falha ao carregar instâncias do WhatsApp: ${error.message}`);
    },
  });

  // Create a new WhatsApp instance in the database
  const createInstance = useMutation<WhatsAppInstance, Error, { instance_name: string }>({
    mutationFn: async (newInstance) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({ ...newInstance, user_id: userId })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      showSuccess("Instância criada com sucesso! Agora, conecte-a.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao criar instância: ${error.message}`);
    },
  });

  // Update a WhatsApp instance (e.g., name, avatar)
  const updateInstance = useMutation<WhatsAppInstance, Error, UpdateInstancePayload>({
    mutationFn: async ({ instanceId, instance_name, avatarFile, phone }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      let newAvatarUrl: string | null | undefined = undefined;

      if (avatarFile) {
        const fileExtension = avatarFile.name.split('.').pop();
        const fileName = `${userId}/${uuidv4()}.${fileExtension}`; // user_id/uuid.ext
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('whatsapp-avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Falha ao fazer upload do avatar: ${uploadError.message}`);
        }
        newAvatarUrl = supabase.storage.from('whatsapp-avatars').getPublicUrl(fileName).data.publicUrl;
      } else if (avatarFile === null) { // Explicitly set to null to remove existing avatar
        newAvatarUrl = null;
      }

      const updatePayload: Partial<WhatsAppInstance> = { updated_at: new Date().toISOString() };
      if (instance_name !== undefined) updatePayload.instance_name = instance_name;
      if (newAvatarUrl !== undefined) updatePayload.avatar_url = newAvatarUrl;
      if (phone !== undefined) updatePayload.phone = phone;

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update(updatePayload)
        .eq('id', instanceId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }
      showSuccess("Instância atualizada com sucesso!");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao atualizar instância: ${error.message}`);
    },
  });

  // Connect a WhatsApp instance (generates QR or pairing code)
  const connectInstance = useMutation<any, Error, ConnectInstancePayload>({
    mutationFn: async ({ instanceId, phone }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      // 1. Update instance status to 'connecting' in DB
      const { error: updateError1 } = await supabase
        .from('whatsapp_instances')
        .update({ status: 'connecting', qr_code_base64: null, pairing_code: null, phone: phone || null })
        .eq('id', instanceId)
        .eq('user_id', userId)
        .select();

      if (updateError1) {
        throw new Error(`Falha ao atualizar status inicial: ${updateError1.message}`);
      }

      // 2. Call the Uazapi proxy to initiate connection
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('clever-function/instance/connect', {
        body: { phone: phone || undefined }, // Pass undefined if phone is null/empty string
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }
      if (proxyResponse?.error) {
        throw new Error(proxyResponse.details || proxyResponse.error);
      }

      console.log("[useWhatsApp] Data received from proxy for connect:", proxyResponse); // ADDED LOG

      // Extract data from the nested 'instance' object
      const uazapiInstanceData = proxyResponse.instance;
      if (!uazapiInstanceData) {
        throw new Error("Resposta da Uazapi não contém dados da instância esperados.");
      }

      // 3. Update instance with QR code or pairing code from Uazapi response
      const updatePayload: Partial<WhatsAppInstance> = { status: 'connecting' };
      if (uazapiInstanceData.qrcode) {
        updatePayload.qr_code_base64 = uazapiInstanceData.qrcode;
      }
      if (uazapiInstanceData.paircode) {
        updatePayload.pairing_code = uazapiInstanceData.paircode;
      }
      // Update phone if Uazapi returns it (especially for pairing code flow)
      if (uazapiInstanceData.phone) {
        updatePayload.phone = uazapiInstanceData.phone;
      }
      // Also update status if Uazapi returns a more specific status immediately
      if (uazapiInstanceData.status) {
        updatePayload.status = uazapiInstanceData.status;
      }


      const { error: updateError2 } = await supabase
        .from('whatsapp_instances')
        .update(updatePayload)
        .eq('id', instanceId)
        .eq('user_id', userId)
        .select();

      if (updateError2) {
        throw new Error(`Falha ao atualizar QR/Pairing Code: ${updateError2.message}`);
      }

      showSuccess("Conexão iniciada! Escaneie o QR code ou use o código de pareamento.");
      return proxyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao iniciar conexão: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
  });

  // Check status of a WhatsApp instance
  const checkInstanceStatus = useMutation<any, Error, string>({
    mutationFn: async (instanceId) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      // 1. Call the Uazapi proxy directly (no phone needed for status check)
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('clever-function/instance/status');

      if (proxyError) {
        throw new Error(proxyError.message);
      }
      if (proxyResponse?.error) {
        throw new Error(proxyResponse.details || proxyResponse.error);
      }

      const uazapiInstanceData = proxyResponse.instance;
      if (!uazapiInstanceData) {
        throw new Error("Resposta da Uazapi não contém dados da instância esperados.");
      }

      const newStatus = uazapiInstanceData.status;
      const newPhone = uazapiInstanceData.phone || null; // Capture phone if available
      
      console.log(`[useWhatsApp] Status received from Uazapi for instance ${instanceId}: ${newStatus}, Phone: ${newPhone}`);

      // 2. Fetch current status from DB to check for status change and get current phone
      const { data: instanceData, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('status')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !instanceData) {
        // If the instance was deleted while checking status, just stop.
        return { message: "Instância não encontrada no DB, ignorando atualização." };
      }

      // 3. Update instance status, QR, pairing code, and phone in DB
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ 
          status: newStatus, 
          qr_code_base64: uazapiInstanceData.qrcode || null, 
          pairing_code: uazapiInstanceData.paircode || null,
          phone: newPhone // Always update phone if Uazapi provides it
        })
        .eq('id', instanceId)
        .eq('user_id', userId)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (newStatus === 'connected' && instanceData.status !== 'connected') {
        showSuccess("Instância conectada com sucesso!");
      } else if (newStatus === 'disconnected' && instanceData.status !== 'disconnected') {
        showError("Instância desconectada.");
      }
      
      return proxyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao verificar status: ${error.message}`);
    },
  });

  // Disconnect a WhatsApp instance
  const disconnectInstance = useMutation<any, Error, string>({
    mutationFn: async (instanceId) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      // 1. Call the Uazapi proxy to disconnect. We rely on the token in the proxy function
      // to identify the instance, as per the Uazapi documentation/curl example.
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('clever-function/instance/disconnect');

      if (proxyError) {
        throw new Error(proxyError.message);
      }
      if (proxyResponse?.error) {
        throw new Error(proxyResponse.details || proxyResponse.error);
      }

      // 2. Update instance status to 'disconnected' in DB
      const { error: updateError } = await supabase
        .from('whatsapp_instances')
        .update({ status: 'disconnected', qr_code_base64: null, pairing_code: null })
        .eq('id', instanceId)
        .eq('user_id', userId)
        .select();

      if (updateError) {
        throw new Error(updateError.message);
      }

      showSuccess("Instância desconectada com sucesso!");
      return proxyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao desconectar instância: ${error.message}`);
    },
  });

  // Delete a WhatsApp instance
  const deleteInstance = useMutation<void, Error, string>({
    mutationFn: async (instanceId) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      // Fetch instance to get avatar_url before deleting
      const { data: instanceToDelete, error: fetchError } = await supabase
        .from('whatsapp_instances')
        .select('avatar_url')
        .eq('id', instanceId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        // Proceed with DB deletion even if avatar_url fetch fails
        console.warn(`Could not fetch avatar_url for instance ${instanceId} before deletion: ${fetchError.message}`);
      }

      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instanceId)
        .eq('user_id', userId); // Ensure user owns the instance

      if (error) {
        console.error("Supabase delete task error:", error);
        throw new Error(error.message);
      }

      // If there was an avatar, delete it from storage
      if (instanceToDelete?.avatar_url) {
        const fileName = instanceToDelete.avatar_url.split('/').pop(); // Get file name from URL
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('whatsapp-avatars')
            .remove([`${userId}/${fileName}`]); // Path in storage is user_id/filename

          if (storageError) {
            console.error(`Falha ao deletar avatar do storage: ${storageError.message}`);
          }
        }
      }

      showSuccess("Instância excluída com sucesso!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsappInstances"] });
    },
    onError: (error) => {
      showError(`Falha ao excluir instância: ${error.message}`);
    },
  });

  // Send a message
  const sendMessage = useMutation<any, Error, SendMessagePayload>({
    mutationFn: async ({ phone, message }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      // Use the correct Uazapi endpoint /send/text
      const { data: proxyResponse, error: proxyError } = await supabase.functions.invoke('clever-function/send/text', {
        body: { 
          number: phone, 
          text: message,
          // Adicionando linkPreview=true por padrão para melhor UX, se houver links
          linkPreview: true 
        },
      });

      if (proxyError) {
        throw new Error(proxyError.message);
      }
      if (proxyResponse?.error) {
        throw new Error(proxyResponse.details || proxyResponse.error);
      }

      return proxyResponse;
    },
    onError: (error) => {
      showError(`Falha ao enviar mensagem: ${error.message}`);
    },
  });

  return {
    fetchInstances,
    createInstance,
    updateInstance, // Adicionado
    connectInstance,
    checkInstanceStatus,
    disconnectInstance,
    deleteInstance,
    sendMessage,
  };
};