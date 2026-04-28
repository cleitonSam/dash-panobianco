import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper para converter ArrayBuffer para Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // A URL da imagem a ser buscada está fixa por segurança
    const imageUrl = "https://cdn.prod.website-files.com/67ec66139f8f56d61a1cd4c9/68a4974d9925b142d28aa8e5_Logo-Panobianco-original-claro.svg";

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Falha ao buscar a imagem com status: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = arrayBufferToBase64(imageBuffer);
    const imageType = response.headers.get('content-type') || 'image/svg+xml'; // Alterado para svg+xml

    const dataUrl = `data:${imageType};base64,${imageBase64}`;

    return new Response(
      JSON.stringify({ dataUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[image-proxy] Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})