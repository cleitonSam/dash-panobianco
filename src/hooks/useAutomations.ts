"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useSession } from "@/components/SessionContextProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutomationCategory =
  | "inadimplentes"
  | "aniversariantes"
  | "sem_presenca_7dias"
  | "contrato_fim_3dias"
  | "contrato_cancelar_5dias";

export interface MessageTemplate {
  id: string;
  user_id: string;
  category: AutomationCategory;
  message_template: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  message_variations?: string[]; // Variações de mensagens para disparo inteligente
}

export interface DispatchLog {
  id: string;
  user_id: string;
  category: AutomationCategory | "teste" | "custom";
  triggered_by: "manual" | "auto" | "test";
  total_members: number;
  sent_count: number;
  failed_count: number;
  started_at: string;
  completed_at: string | null;
  details: { phone: string; name: string; status: string; error?: string; message_used?: string }[] | null;
}

export interface DispatchResult {
  success: boolean;
  category: string;
  total: number;
  sent: number;
  failed: number;
  error?: string;
  details?: { phone: string; name: string; status: string; error?: string }[];
}

// ─── Metadados de cada categoria ─────────────────────────────────────────────

export const AUTOMATION_CATEGORIES: {
  key: AutomationCategory;
  label: string;
  description: string;
  defaultTemplate: string;
  icon: string;
}[] = [
  {
    key: "inadimplentes",
    label: "Inadimplentes",
    description: "Alunos com contrato inadimplente, vencido ou cancelado.",
    defaultTemplate:
      "Olá {nome}, notamos que seu contrato na Panobianco está com situação pendente. Por favor, regularize sua situação o quanto antes para evitar a suspensão do acesso. Entre em contato conosco! 💪",
    icon: "💰",
  },
  {
    key: "aniversariantes",
    label: "Aniversariantes do Dia",
    description: "Alunos que fazem aniversário hoje.",
    defaultTemplate:
      "🎉 Feliz Aniversário, {nome}! A equipe Panobianco deseja um dia incrível, cheio de alegria e muita saúde! Você é muito especial para nós. 🎂",
    icon: "🎂",
  },
  {
    key: "sem_presenca_7dias",
    label: "Sem Presença em 7 Dias",
    description: "Alunos ativos que não aparecem há 7 ou mais dias.",
    defaultTemplate:
      "Ei, {nome}! Sentimos sua falta aqui na Panobianco! Faz alguns dias que você não aparece. Que tal voltar hoje e retomar os treinos? Estamos te esperando! 💪",
    icon: "🏃",
  },
  {
    key: "contrato_fim_3dias",
    label: "Contrato Mensal a Vencer (3 dias)",
    description: "Alunos com plano mensal ativo vencendo em até 3 dias.",
    defaultTemplate:
      "Atenção, {nome}! Seu plano mensal na Panobianco vence em 3 dias. Renove agora para continuar aproveitando todos os benefícios sem interrupção! Entre em contato conosco. 🏋️",
    icon: "📅",
  },
  {
    key: "contrato_cancelar_5dias",
    label: "Contratos a Cancelar (5 dias)",
    description: "Alunos ativos com contrato vencendo em até 5 dias.",
    defaultTemplate:
      "{nome}, seu contrato na Panobianco vence em breve. Não perca seu acesso! Entre em contato conosco para renovação e continue sua evolução. 🌟",
    icon: "⚠️",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Seleciona aleatoriamente uma variação de mensagem */
export function pickRandomMessage(
  mainTemplate: string,
  variations: string[] = []
): string {
  const all = [mainTemplate, ...variations.filter((v) => v.trim().length > 0)];
  return all[Math.floor(Math.random() * all.length)];
}

/** Formata número de telefone brasileiro para envio */
export function formatPhoneBR(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  // Adiciona 55 se não tiver código do país
  if (cleaned.length <= 11) {
    cleaned = "55" + cleaned;
  }
  return cleaned;
}

/** Parse CSV/texto colado de números */
export function parsePhoneList(input: string): string[] {
  return input
    .split(/[\n,;|\t]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 8)
    .map(formatPhoneBR)
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicatas
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAutomations = () => {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const userId = session?.user?.id;

  // ── Buscar todos os templates do usuário ──────────────────────────────────
  const fetchTemplates = useQuery<MessageTemplate[], Error>({
    queryKey: ["automationTemplates", userId],
    queryFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from("whatsapp_message_templates")
        .select("*")
        .eq("user_id", userId)
        .order("category");

      if (error) throw new Error(error.message);
      return (data ?? []) as MessageTemplate[];
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

  // ── Salvar/atualizar template (com variações) ────────────────────────────
  const saveTemplate = useMutation<
    MessageTemplate,
    Error,
    {
      category: AutomationCategory;
      message_template: string;
      enabled?: boolean;
      message_variations?: string[];
    }
  >({
    mutationFn: async ({
      category,
      message_template,
      enabled = true,
      message_variations = [],
    }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from("whatsapp_message_templates")
        .upsert(
          {
            user_id: userId,
            category,
            message_template,
            enabled,
            message_variations,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,category" }
        )
        .select()
        .single();

      if (error) throw new Error(error.message);
      showSuccess("Template salvo com sucesso!");
      return data as MessageTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automationTemplates"] });
    },
    onError: (error) => {
      showError(`Falha ao salvar template: ${error.message}`);
    },
  });

  // ── Ativar/desativar automação ────────────────────────────────────────────
  const toggleAutomation = useMutation<
    void,
    Error,
    { category: AutomationCategory; enabled: boolean }
  >({
    mutationFn: async ({ category, enabled }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from("whatsapp_message_templates")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("category", category);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_, { enabled, category }) => {
      queryClient.invalidateQueries({ queryKey: ["automationTemplates"] });
      const catLabel =
        AUTOMATION_CATEGORIES.find((c) => c.key === category)?.label ?? category;
      showSuccess(
        enabled
          ? `Automação "${catLabel}" ativada.`
          : `Automação "${catLabel}" desativada.`
      );
    },
    onError: (error) => {
      showError(`Falha ao alterar status: ${error.message}`);
    },
  });

  // ── Disparar manualmente por categoria (chama edge function) ────────────
  const dispatch = useMutation<
    DispatchResult,
    Error,
    { category: AutomationCategory }
  >({
    mutationFn: async ({ category }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase.functions.invoke(
        "dispatch-whatsapp",
        { body: { category, triggered_by: "manual" } }
      );

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      return data as DispatchResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dispatchLogs"] });
      const catLabel =
        AUTOMATION_CATEGORIES.find((c) => c.key === result.category)?.label ??
        result.category;
      if (result.failed === 0) {
        showSuccess(
          `"${catLabel}": ${result.sent} mensagens enviadas com sucesso!`
        );
      } else {
        showError(
          `"${catLabel}": ${result.sent} enviadas, ${result.failed} falhas.`
        );
      }
    },
    onError: (error) => {
      showError(`Falha no disparo: ${error.message}`);
    },
  });

  // ── Disparo de TESTE (envia para 1 número específico) ───────────────────
  const testDispatch = useMutation<
    { success: boolean; error?: string },
    Error,
    { phone: string; message: string; name?: string; imageUrl?: string }
  >({
    mutationFn: async ({ phone, message, name = "Teste", imageUrl }) => {
      if (!userId) throw new Error("Usuário não autenticado.");

      const formattedPhone = formatPhoneBR(phone);
      const finalMessage = message
        .replace(/\{nome\}/gi, name)
        .replace(/\{name\}/gi, name);

      // Se tem imagem, envia como imagem com caption
      if (imageUrl?.trim()) {
        const { data, error } = await supabase.functions.invoke(
          "clever-function/send/image",
          {
            body: {
              number: formattedPhone,
              image: imageUrl.trim(),
              caption: finalMessage,
            },
          }
        );
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.details || data.error);
      } else {
        const { data, error } = await supabase.functions.invoke(
          "clever-function/send/text",
          {
            body: {
              number: formattedPhone,
              text: finalMessage,
              linkPreview: true,
            },
          }
        );
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.details || data.error);
      }

      return { success: true };
    },
    onSuccess: () => {
      showSuccess("Mensagem de teste enviada com sucesso!");
    },
    onError: (error) => {
      showError(`Falha no envio de teste: ${error.message}`);
    },
  });

  // ── Disparo CUSTOM (lista de números via CSV/colagem) ───────────────────
  const customDispatch = useMutation<
    {
      total: number;
      sent: number;
      failed: number;
      details: { phone: string; name: string; status: string; error?: string }[];
    },
    Error,
    {
      phones: string[];
      message: string;
      variations?: string[];
      imageUrl?: string;
      delayMs?: number;
    }
  >({
    mutationFn: async ({ phones, message, variations = [], imageUrl, delayMs = 2000 }) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      if (phones.length === 0)
        throw new Error("Nenhum número válido encontrado.");

      const hasImage = !!imageUrl?.trim();
      const results: {
        phone: string;
        name: string;
        status: string;
        error?: string;
      }[] = [];
      let sentCount = 0;
      let failedCount = 0;

      for (let i = 0; i < phones.length; i++) {
        const phone = phones[i];
        const chosenMsg = pickRandomMessage(message, variations);
        const finalMessage = chosenMsg
          .replace(/\{nome\}/gi, "")
          .replace(/\{name\}/gi, "")
          .trim();

        try {
          if (hasImage) {
            const { data, error } = await supabase.functions.invoke(
              "clever-function/send/image",
              {
                body: {
                  number: phone,
                  image: imageUrl!.trim(),
                  caption: finalMessage,
                },
              }
            );
            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.details || data.error);
          } else {
            const { data, error } = await supabase.functions.invoke(
              "clever-function/send/text",
              {
                body: {
                  number: phone,
                  text: finalMessage,
                  linkPreview: true,
                },
              }
            );
            if (error) throw new Error(error.message);
            if (data?.error) throw new Error(data.details || data.error);
          }

          results.push({ phone, name: "-", status: "sent" });
          sentCount++;
        } catch (err: any) {
          results.push({
            phone,
            name: "-",
            status: "failed",
            error: err.message,
          });
          failedCount++;
        }

        // ── DELAY INTELIGENTE ──
        // Progressivo: aumenta o delay conforme mais mensagens são enviadas
        // para evitar bloqueio do WhatsApp
        if (i < phones.length - 1) {
          const baseDelay = delayMs;
          const jitter = Math.floor(Math.random() * 2000); // 0-2s de jitter
          // A cada 10 mensagens, adiciona 3s extra de pausa
          const progressiveExtra = Math.floor(i / 10) * 3000;
          // A cada 30 mensagens, faz uma pausa longa (8-15s)
          const longPause = (i + 1) % 30 === 0 ? 8000 + Math.floor(Math.random() * 7000) : 0;
          const totalDelay = baseDelay + jitter + progressiveExtra + longPause;
          await new Promise((r) => setTimeout(r, totalDelay));
        }
      }

      // Salvar log no banco
      await supabase.from("whatsapp_dispatch_logs").insert({
        user_id: userId,
        category: "custom",
        triggered_by: "manual",
        total_members: phones.length,
        sent_count: sentCount,
        failed_count: failedCount,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        details: results,
      });

      return { total: phones.length, sent: sentCount, failed: failedCount, details: results };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dispatchLogs"] });
      if (result.failed === 0) {
        showSuccess(
          `Disparo personalizado: ${result.sent} mensagens enviadas!`
        );
      } else {
        showError(
          `Disparo personalizado: ${result.sent} enviadas, ${result.failed} falhas.`
        );
      }
    },
    onError: (error) => {
      showError(`Falha no disparo personalizado: ${error.message}`);
    },
  });

  // ── Histórico de disparos ─────────────────────────────────────────────────
  const fetchLogs = useQuery<DispatchLog[], Error>({
    queryKey: ["dispatchLogs", userId],
    queryFn: async () => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { data, error } = await supabase
        .from("whatsapp_dispatch_logs")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return (data ?? []) as DispatchLog[];
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  });

  return {
    fetchTemplates,
    saveTemplate,
    toggleAutomation,
    dispatch,
    testDispatch,
    customDispatch,
    fetchLogs,
    pickRandomMessage,
  };
};
