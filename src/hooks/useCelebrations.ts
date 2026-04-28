import { useQuery } from "@tanstack/react-query";
import { format, parse, getYear, startOfDay } from "date-fns"; // Importar startOfDay
import { ptBR } from "date-fns/locale";
import { showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

// Removido: const API_URL_DATAS = "https://api.steinhq.com/v1/storages/68ccbdebaffba40a62fdc332/datas";

interface RawCelebration {
  Mês: string;
  Data: string;
  Comemoração: string;
}

export interface Celebration {
  date: Date;
  description: string;
}

const monthMap: { [key: string]: number } = {
  "Janeiro": 0, "Fevereiro": 1, "Março": 2, "Abril": 3, "Maio": 4, "Junho": 5,
  "Julho": 6, "Agosto": 7, "Setembro": 8, "Outubro": 9, "Novembro": 10, "Dezembro": 11,
};

export const useCelebrations = () => {
  return useQuery<Celebration[], Error>({
    queryKey: ["celebrations"],
    queryFn: async () => {
      // Chamar a Edge Function em vez da API externa diretamente
      const { data, error: supabaseError } = await supabase.functions.invoke('celebrations-proxy');

      if (supabaseError) {
        throw new Error(`Erro de conexão (Comemorações): ${supabaseError.message}`);
      }

      if (data?.error) {
        throw new Error(`Erro na API Steinhq (Comemorações): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : ''));
      }

      const rawData: RawCelebration[] = data || [];

      const currentYear = getYear(new Date());

      const celebrations: Celebration[] = rawData
        .map((item) => {
          const monthIndex = monthMap[item.Mês];
          const day = parseInt(item.Data, 10);

          if (monthIndex === undefined || isNaN(day)) {
            // console.warn("Skipping invalid celebration data:", item);
            return null;
          }

          // Create a date for the current year
          const date = new Date(currentYear, monthIndex, day);
          
          // Validate the date to ensure it's a real date (e.g., no Feb 30)
          if (date.getMonth() !== monthIndex || date.getDate() !== day) {
            // console.warn("Skipping invalid date (e.g., Feb 30):", item);
            return null;
          }

          return {
            date: startOfDay(date), // Normalizar para o início do dia
            description: item.Comemoração,
          };
        })
        .filter((item): item is Celebration => item !== null); // Filter out nulls

      return celebrations;
    },
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    onError: (error) => {
      showError(`Falha ao carregar as comemorações: ${error.message}`);
      // console.error("Error fetching celebrations:", error);
    },
  });
};