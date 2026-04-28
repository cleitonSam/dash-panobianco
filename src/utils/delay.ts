/** Atraso fixo */
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Atraso inteligente anti-bloqueio WhatsApp
 * - Base: 4–8 segundos (aleatório)
 * - A cada 10 mensagens: pausa longa de 20–40 segundos
 */
export const smartDelay = async (messageIndex: number) => {
  if (messageIndex > 0 && messageIndex % 10 === 0) {
    // Pausa longa a cada 10 mensagens
    const longPause = 20000 + Math.floor(Math.random() * 20000); // 20-40s
    await delay(longPause);
  } else {
    // Pausa curta aleatória entre mensagens
    const shortPause = 4000 + Math.floor(Math.random() * 4000); // 4-8s
    await delay(shortPause);
  }
};