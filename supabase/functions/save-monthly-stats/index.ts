import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    // Use a chave de serviço para operações de servidor para bypassar as políticas de RLS.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Invoca a função 'evo-proxy' para obter os dados atuais dos membros.
    const { data: evoData, error: evoError } = await supabaseClient.functions.invoke("evo-proxy");

    if (evoError) {
      throw new Error(`Falha ao buscar dados do proxy da EVO: ${evoError.message}`);
    }
    if (evoData?.error) {
      throw new Error(`Erro da API EVO retornado pelo proxy: ${evoData.details || evoData.error}`);
    }

    const members = evoData || [];

    // Calcula a contagem de adimplentes.
    const calculateAdimplentesCount = (members: any[]): number => {
      const filteredMembers = members.filter(member => {
        const planName = member.NomeContrato?.toLowerCase() || '';
        return !(
          planName.includes('influenciador') ||
          planName.includes('personal') ||
          planName.includes('combo 3 diárias') ||
          planName.includes('wellhub') ||
          planName.includes('totalpass')
        );
      });

      let membersWithActiveStatus = 0;
      filteredMembers.forEach(member => {
        const status = member.StatusContrato?.toLowerCase() || '';
        if (status.includes('ativo')) {
          membersWithActiveStatus++;
        }
      });
      return membersWithActiveStatus;
    };

    const adimplentesCount = calculateAdimplentesCount(members);

    // Obtém o primeiro dia do mês atual.
    const today = new Date();
    const monthStartDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

    // Usa 'upsert' para inserir ou atualizar o registro do mês atual.
    const { error: upsertError } = await supabaseClient
      .from('monthly_member_stats')
      .upsert(
        { 
          month_start_date: monthStartDate, 
          adimplentes_count: adimplentesCount,
          created_at: new Date().toISOString()
        },
        { onConflict: 'month_start_date' }
      );

    if (upsertError) {
      throw new Error(`Falha ao salvar estatísticas mensais: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({ message: `Estatísticas mensais salvas com sucesso para ${monthStartDate}`, adimplentes_count: adimplentesCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // console.error('Erro na função save-monthly-stats:', error);
    return new Response(
      JSON.stringify({ error: "Ocorreu um erro interno na função.", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})