# Deploy da Edge Function Corrigida

## Como fazer o deploy no Supabase (seu outro projeto)

### Via Painel (mais simples):

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto
2. Menu lateral: **Edge Functions** → clique em `clever-function`
3. Clique no ícone de **lápis (Edit)**
4. **Apague TODO o conteúdo** do editor
5. **Cole este código abaixo na íntegra:**

```typescript
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

  try {

  console.log('[clever-function] UAZAPI_TOKEN status:', UAZAPI_TOKEN ? 'Configured' : 'NOT CONFIGURED');

  if (!UAZAPI_TOKEN) {
    console.error('[clever-function] UAZAPI_TOKEN is not configured.');
    // Return 200 so the Supabase client can read the error details
    return new Response(
      JSON.stringify({ error: 'UAZAPI_TOKEN não configurado no Supabase. Configure o secret UAZAPI_TOKEN no painel do Supabase.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
  } else if (path === '/instance/connect' || path === '/send/text') {
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

  // Parse response body safely - read text first to avoid double-consume issues
  const rawBody = await uazapiResponse.text().catch(() => '');
  let uazapiData: any;
  try {
    uazapiData = JSON.parse(rawBody);
  } catch (e) {
    uazapiData = { message: rawBody || 'Resposta inválida da UAZAPI' };
  }

  if (!uazapiResponse.ok) {
    console.error(`[clever-function] Uazapi API request failed. Status: ${uazapiResponse.status}. Details:`, uazapiData);
    // Always return 200 so Supabase client doesn't swallow the real error details
    return new Response(
      JSON.stringify({
        error: `Falha na UAZAPI (status ${uazapiResponse.status})`,
        details: uazapiData?.message || uazapiData?.error || uazapiData?.detail || JSON.stringify(uazapiData)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[clever-function] Uazapi API successful response for path ${path}:`, uazapiData);
  return new Response(
    JSON.stringify(uazapiData),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )

  } catch (err: any) {
    console.error('[clever-function] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: `Erro interno na Edge Function: ${err?.message || String(err)}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

6. Clique em **Deploy** (ou salvar)
7. Pronto! ✅

---

## O que foi corrigido:

| Antes | Depois |
|-------|--------|
| Erro genérico: *"Edge Function returned a non-2xx status code"* | Mensagem real: *"UAZAPI_TOKEN não configurado"* ou erro específico do UAZAPI |
| Status HTTP 500 propagado (quebrava o cliente) | Sempre HTTP 200 com erro no JSON body |
| Sem try/catch global | Try/catch adicionado para capturar exceções inesperadas |

---

## Próximos passos:

1. ✅ Deploy da edge function (faça acima)
2. ⬜ Configure o secret `UAZAPI_TOKEN` no Supabase (se não tiver)
3. ⬜ Teste o botão "Conectar Número Existente" na aplicação
4. ⬜ Deploy no Vercel (quando pronto)
