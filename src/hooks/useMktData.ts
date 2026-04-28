import { useQuery } from "@tanstack/react-query";
import { format, parseISO, isWithinInterval, startOfDay } from "date-fns"; // Importar startOfDay
import { showError } from "@/utils/toast";
import { parseCurrencyString } from "@/utils/currency";
import { supabase } from "@/integrations/supabase/client"; // Importar supabase

// Removido: const API_URL_MKT = "https://api.steinhq.com/v1/storages/68cd91e5affba40a62fe17e9/mkt";

interface RawMktData {
  Data: string; // YYYY-MM-DD
  Campanha: string;
  Impressões: string;
  Alcance: string;
  "Valor Investido": string; // "XX,XX"
  Mensagens: string;
  "Custo por Mensagem": string; // "XX,XX"
}

export interface MktData {
  date: Date;
  campaign: string;
  impressions: number;
  reach: number;
  investedValue: number;
  messages: number;
  costPerMessage: number;
}

interface UseMktDataOptions {
  startDate?: Date;
  endDate?: Date;
  campaignName?: string;
}

export const useMktData = (options?: UseMktDataOptions) => {
  return useQuery<MktData[], Error>({
    queryKey: ["mktData", options?.startDate?.toISOString(), options?.endDate?.toISOString(), options?.campaignName],
    queryFn: async () => {
      // Chamar a Edge Function em vez da API externa diretamente
      const { data, error: supabaseError } = await supabase.functions.invoke('mkt-proxy');

      if (supabaseError) {
        throw new Error(`Erro de conexão (Marketing): ${supabaseError.message}`);
      }

      if (data?.error) {
        throw new Error(`Erro na API Steinhq (Marketing): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : ''));
      }

      const rawData: RawMktData[] = data || [];

      const parsedData: MktData[] = rawData.map((item) => ({
        date: startOfDay(parseISO(item.Data)), // Normalizar para o início do dia
        campaign: item.Campanha || 'N/A',
        impressions: parseInt(item.Impressões, 10) || 0,
        reach: parseInt(item.Alcance, 10) || 0,
        investedValue: parseCurrencyString(item["Valor Investido"]),
        messages: parseInt(item.Mensagens, 10) || 0,
        costPerMessage: parseCurrencyString(item["Custo por Mensagem"]),
      }));

      let filteredData = parsedData;

      if (options?.startDate && options?.endDate) {
        const start = startOfDay(options.startDate);
        const end = startOfDay(options.endDate);
        filteredData = filteredData.filter(item => 
          isWithinInterval(item.date, { start: start, end: end })
        );
      }

      if (options?.campaignName && options.campaignName !== 'Todos') {
        filteredData = filteredData.filter(item => item.campaign === options.campaignName);
      }

      return filteredData;
    },
    staleTime: 1000 * 60 * 10, // Cache por 10 minutos
    onError: (error) => {
      showError(`Falha ao carregar dados de marketing: ${error.message}`);
      // console.error("Error fetching marketing data:", error);
    },
  });
};