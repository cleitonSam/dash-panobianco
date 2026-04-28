import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const API_URL_MKT = "https://api.steinhq.com/v1/storages/68cd91e5affba40a62fe17e9/mkt";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    const response = await fetch(API_URL_MKT);

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({ 
          error: `Steinhq API request failed with status: ${response.status}`,
          details: errorBody
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jsonData = await response.json();

    return new Response(
      JSON.stringify(jsonData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})