import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const EVO_PROSPECTS_URL = 'https://evo-integracao-api.w12app.com.br/api/v1/prospects';
const EVO_DNS = Deno.env.get('EVO_DNS'); // Lendo do Supabase Secrets
const EVO_SECRET_KEY = Deno.env.get('EVO_SECRET_KEY'); // Lendo do Supabase Secrets
const PAGE_SIZE = 50; // Maximum 'take' value allowed by the API

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  console.log('[prospects-proxy] Function started.');
  console.log(`[prospects-proxy] EVO_DNS configured: ${!!EVO_DNS}`);
  console.log(`[prospects-proxy] EVO_SECRET_KEY configured: ${!!EVO_SECRET_KEY}`);

  if (!EVO_DNS || !EVO_SECRET_KEY) {
    console.error('[prospects-proxy] EVO_DNS or EVO_SECRET_KEY not configured.');
    return new Response(
      JSON.stringify({ error: 'EVO_DNS or EVO_SECRET_KEY not configured in Supabase Secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const urlParams = new URL(req.url).searchParams;
    let registerDateStart = urlParams.get('registerDateStart');
    let registerDateEnd = urlParams.get('registerDateEnd');

    if (!registerDateStart || !registerDateEnd) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      registerDateStart = formatDate(firstDayOfMonth);
      registerDateEnd = formatDate(lastDayOfMonth);
      console.log(`[prospects-proxy] No dates provided, defaulting to current month: ${registerDateStart} to ${registerDateEnd}`);
    } else {
      console.log(`[prospects-proxy] Using provided dates: ${registerDateStart} to ${registerDateEnd}`);
    }

    const authHeader = 'Basic ' + btoa(`${EVO_DNS}:${EVO_SECRET_KEY}`);
    let allProspects: any[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `${EVO_PROSPECTS_URL}?registerDateStart=${registerDateStart}&registerDateEnd=${registerDateEnd}&take=${PAGE_SIZE}&skip=${skip}`;
      console.log(`[prospects-proxy] Fetching from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[prospects-proxy] EVO API request failed. Status: ${response.status}. Body: ${errorBody}`);
        return new Response(
          JSON.stringify({ 
            error: `EVO API request failed with status: ${response.status}`,
            details: errorBody,
            url: apiUrl
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = await response.json();
      console.log(`[prospects-proxy] Fetched ${data.length} items from skip ${skip}`);

      if (data && Array.isArray(data)) {
        allProspects = allProspects.concat(data);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          skip += PAGE_SIZE;
        }
      } else {
        console.warn("[prospects-proxy] Unexpected data format from EVO API:", data);
        hasMore = false;
      }
    }

    console.log(`[prospects-proxy] Total prospects fetched: ${allProspects.length}`);

    return new Response(
      JSON.stringify({
        data: allProspects,
        period: `${registerDateStart} até ${registerDateEnd}`,
        total: allProspects.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[prospects-proxy] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})