import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toast";
import { parseISO, startOfDay } from "date-fns"; // Importar startOfDay
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

// Removido: const API_URL_SEGUIDORES = "https://api.steinhq.com/v1/storages/68cd91e5affba40a62fe17e9/seguidores";

interface RawFollowersData {
  Seguidores: string; // "XXXXX"
  "Data da consulta": string; // YYYY-MM-DD
}

export interface FollowersData {
  followers: number;
  date: Date;
}

export const useFollowersData = () => {
  return useQuery<FollowersData[], Error>({
    queryKey: ["followersData"],
    queryFn: async () => {
      // Chamar a Edge Function em vez da API externa diretamente
      const { data, error: supabaseError } = await supabase.functions.invoke('followers-proxy');

      if (supabaseError) {
        throw new Error(`Erro de conexão (Seguidores): ${supabaseError.message}`);
      }

      if (data?.error) {
        throw new Error(`Erro na API Steinhq (Seguidores): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : ''));
      }

      const rawData: RawFollowersData[] = data || [];

      const parsedData: FollowersData[] = rawData.map((item) => ({
        followers: parseInt(item.Seguidores, 10) || 0,
        date: startOfDay(parseISO(item["Data da consulta"])), // Normalizar para o início do dia
      })).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending

      return parsedData;
    },
    staleTime: 1000 * 60 * 60, // Cache por 1 hora
    onError: (error) => {
      showError(`Falha ao carregar dados de seguidores: ${error.message}`);
      // console.error("Error fetching followers data:", error);
    },
  });
};