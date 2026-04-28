export const getClientId = (item: any, type: 'member' | 'prospect' | 'receivable' | 'unknown' = 'unknown'): string | null => {
  if (!item) return null;
  let rawId: any;

  if (type === 'member' || type === 'receivable') {
    rawId = item.IDCliente || item.IdCliente || item.idcliente;
  } else if (type === 'prospect') {
    rawId = item.idProspect;
  } else {
    // Fallback for unknown types, try common keys
    rawId = item.IDCliente || item.IdCliente || item.idcliente || item.idProspect || item.id;
  }
  
  if (rawId === null || rawId === undefined || String(rawId).trim() === '') return null;
  
  const trimmedId = String(rawId).trim();
  const parsedId = parseInt(trimmedId, 10);
  
  // If it's a number and matches after removing leading zeros, return as string
  if (!isNaN(parsedId) && String(parsedId) === trimmedId.replace(/^0+/, '')) {
    return String(parsedId);
  }
  
  // Otherwise, return the trimmed string
  return trimmedId;
};