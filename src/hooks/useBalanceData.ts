import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toast";
import { parseCurrencyString } from "@/utils/currency";
import { parseISO, startOfDay } from "date-fns"; // Importar startOfDay
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

// Removido: const API_URL_SALDO = "https://api.steinhq.com/v1/storages/68cd91e5affba40a62fe17e9/saldo";

interface RawBalanceData {
  "Saldo disponível": string; // "XX,XX"
  Data: string; // YYYY-MM-DD
}

export interface BalanceData {
  balance: number;
  date: Date;
}

export const useBalanceData = () => {
  return useQuery<BalanceData | null, Error>({
    queryKey: ["balanceData"],
    queryFn: async () => {
      // Chamar a Edge Function em vez da API externa diretamente
      const { data, error: supabaseError } = await supabase.functions.invoke('balance-proxy');

      if (supabaseError) {
        throw new Error(`Erro de conexão (Saldo): ${supabaseError.message}`);
      }

      if (data?.error) {
        throw new Error(`Erro na API Steinhq (Saldo): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : ''));
      }

      const rawData: RawBalanceData[] = data || [];

      if (rawData.length === 0) return null;

      // Assume the latest entry is the most relevant balance
      const latestEntry = rawData.sort((a, b) => parseISO(b.Data).getTime() - parseISO(a.Data).getTime())[0];

      return {
        balance: parseCurrencyString(latestEntry["Saldo disponível"]),
        date: startOfDay(parseISO(latestEntry.Data)), // Normalizar para o início do dia
      };
    },
    staleTime: 1000 * 60 * 30, // Cache por 30 minutos
    onError: (error) => {
      showError(`Falha ao carregar saldo disponível: ${error.message}`);
      // console.error("Error fetching balance data:", error);
    },
  });
};