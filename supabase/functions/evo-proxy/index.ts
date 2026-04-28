import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import * as xlsx from "https://esm.sh/xlsx@0.18.5";

const EVO_URL = 'https://evo-integracao.w12app.com.br/api/v1/members/summary-excel';
const EVO_DNS = Deno.env.get('EVO_DNS'); // Lendo do Supabase Secrets
const EVO_SECRET_KEY = Deno.env.get('EVO_SECRET_KEY'); // Lendo do Supabase Secrets

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  console.log('[evo-proxy] Function started.');
  console.log(`[evo-proxy] EVO_DNS configured: ${!!EVO_DNS}`);
  console.log(`[evo-proxy] EVO_SECRET_KEY configured: ${!!EVO_SECRET_KEY}`);

  if (!EVO_DNS || !EVO_SECRET_KEY) {
    console.error('[evo-proxy] EVO_DNS or EVO_SECRET_KEY not configured.');
    return new Response(
      JSON.stringify({ error: 'EVO_DNS or EVO_SECRET_KEY not configured in Supabase Secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const authHeader = 'Basic ' + btoa(`${EVO_DNS}:${EVO_SECRET_KEY}`);
    console.log(`[evo-proxy] Fetching from EVO_URL: ${EVO_URL}`);

    const response = await fetch(EVO_URL, {
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[evo-proxy] EVO API request failed. Status: ${response.status}. Body: ${errorBody}`);
      return new Response(
        JSON.stringify({ 
          error: `EVO API request failed with status: ${response.status}`,
          details: errorBody
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const buffer = await response.arrayBuffer();
    const workbook = xlsx.read(new Uint8Array(buffer), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log(`[evo-proxy] Successfully fetched and parsed ${jsonData.length} records.`);

    return new Response(
      JSON.stringify(jsonData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[evo-proxy] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})