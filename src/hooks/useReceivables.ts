import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface UseReceivablesOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export const useReceivables = (options?: UseReceivablesOptions) => {
  return useQuery({
    queryKey: ["receivables", options?.startDate, options?.endDate],
    queryFn: async () => {
      const dtLancamentoDe = options?.startDate;
      const dtLancamentoAte = options?.endDate;

      // A função receivables-proxy já define o padrão para o mês atual se as datas não forem fornecidas.
      // Vamos confiar nesse comportamento padrão aqui.
      let queryString = '';
      if (dtLancamentoDe) {
        queryString += `dtLancamentoDe=${dtLancamentoDe}`;
      }
      if (dtLancamentoAte) {
        queryString += `${queryString ? '&' : ''}dtLancamentoAte=${dtLancamentoAte}`;
      }

      const functionPath = `receivables-proxy${queryString ? '?' + queryString : ''}`;
      // console.log(`[useReceivables] Invoking function: ${functionPath}`);

      const { data, error: supabaseError } = await supabase.functions.invoke(functionPath);

      if (supabaseError) {
        const errorMessage = `Erro de conexão (Recebíveis): ${supabaseError.message}`;
        showError("Falha ao conectar com o servidor para recebíveis.");
        // console.error(supabaseError);
        throw new Error(errorMessage);
      }

      if (data?.error) {
        const errorMessage = `Erro na API EVO (Recebíveis): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : '');
        showError("Falha ao buscar dados de recebíveis da EVO.");
        // console.error(data);
        throw new Error(errorMessage);
      }
      
      const receivables = data?.data || [];
      // console.log(`[useReceivables] Total de linhas na tabela de recebíveis: ${receivables.length}`);
      return receivables;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};