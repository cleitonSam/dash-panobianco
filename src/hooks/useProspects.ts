import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface UseProspectsOptions {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export const useProspects = (options?: UseProspectsOptions) => {
  return useQuery({
    queryKey: ["prospects", options?.startDate, options?.endDate],
    queryFn: async () => {
      const registerDateStart = options?.startDate;
      const registerDateEnd = options?.endDate;

      let queryString = '';
      if (registerDateStart) {
        queryString += `registerDateStart=${registerDateStart}`;
      }
      if (registerDateEnd) {
        queryString += `${queryString ? '&' : ''}registerDateEnd=${registerDateEnd}`;
      }

      const functionPath = `prospects-proxy${queryString ? '?' + queryString : ''}`;
      // console.log(`[useProspects] Invoking function: ${functionPath}`);

      const { data, error: supabaseError } = await supabase.functions.invoke(functionPath);

      if (supabaseError) {
        const errorMessage = `Erro de conexão (Prospects): ${supabaseError.message}`;
        showError("Falha ao conectar com o servidor para prospects.");
        // console.error(supabaseError);
        throw new Error(errorMessage);
      }

      if (data?.error) {
        const errorMessage = `Erro na API EVO (Prospects): ${data.error}` + (data.details ? `\n\nDetalhes: ${data.details}` : '');
        showError("Falha ao buscar dados de prospects da EVO.");
        // console.error(data);
        throw new Error(errorMessage);
      }
      
      const prospects = data?.data || [];
      // console.log(`[useProspects] Total de prospects: ${prospects.length}`);
      return prospects;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};