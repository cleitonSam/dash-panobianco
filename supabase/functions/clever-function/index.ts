import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const UAZAPI_BASE_URL = 'https://fluxodigitaltech.uazapi.com';
const UAZAPI_TOKEN = Deno.env.get('UAZAPI_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle OPTIONS requests first for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  console.log('[clever-function] UAZAPI_TOKEN status:', UAZAPI_TOKEN ? 'Configured' : 'NOT CONFIGURED');

  if (!UAZAPI_TOKEN) {
    console.error('[clever-function] UAZAPI_TOKEN is not configured, returning 500.');
    return new Response(
      JSON.stringify({ error: 'UAZAPI_TOKEN not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const url = new URL(req.url);
  // Adjust path replacement for the new function name
  const path = url.pathname.replace('/clever-function', ''); // e.g., /instance/connect, /send/text

  let uazapiMethod: 'GET' | 'POST' | 'DELETE' | 'PUT';
  let requestBodyForUazapi: any = undefined;
  
  // Determine the method and body based on the path
  if (path === '/instance/status') {
    uazapiMethod = 'GET';
    // No body needed for Uazapi GET /instance/status
  } else if (path === '/instance/disconnect') {
    uazapiMethod = 'POST';
    // Explicitly skip reading body for disconnect, as per Uazapi curl example
    requestBodyForUazapi = undefined;
  } else if (path === '/instance/connect' || path === '/send/text' || path === '/send/image') {
    uazapiMethod = 'POST';
    // For connect/send/text, we need the client's body
    try {
      const clientRequestBody = await req.json();
      requestBodyForUazapi = clientRequestBody;
    } catch (e) {
      // Ignore if body is empty, but log if expected
      console.warn(`[clever-function] No body found for POST path: ${path}`);
    }
  } else {
    // Default or other paths, assume POST and forward body as is
    uazapiMethod = 'POST'; 
    try {
      requestBodyForUazapi = await req.json();
    } catch (e) {
      // Ignore if body is empty
    }
  }

  let fullUazapiURL = `${UAZAPI_BASE_URL}${path}`;

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'token': UAZAPI_TOKEN,
  };

  console.log(`[clever-function] Fetching from Uazapi: ${uazapiMethod} ${fullUazapiURL}`);
  
  const uazapiResponse = await fetch(fullUazapiURL, {
    method: uazapiMethod,
    headers: headers,
    body: uazapiMethod === 'POST' && requestBodyForUazapi ? JSON.stringify(requestBodyForUazapi) : undefined,
  });

  const uazapiData = await uazapiResponse.json();

  if (!uazapiResponse.ok) {
    console.error(`[clever-function] Uazapi API request failed. Status: ${uazapiResponse.status}. Details:`, uazapiData);
    return new Response(
      JSON.stringify({ 
        error: `Uazapi API request failed with status: ${uazapiResponse.status}`,
        details: uazapiData.message || uazapiData.error || JSON.stringify(uazapiData)
      }),
      { status: uazapiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[clever-function] Uazapi API successful response for path ${path}:`, uazapiData);
  return new Response(
    JSON.stringify(uazapiData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})