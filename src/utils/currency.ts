export const parseCurrencyString = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string' || !value) return 0;

  // Remove "R$" prefix and any leading/trailing whitespace
  let cleanedValue = value.replace(/R\$\s*/, '').trim();
  
  // Remove thousands separators (dots) and replace decimal comma with a dot
  cleanedValue = cleanedValue.replace(/\./g, '').replace(/,/g, '.');
  
  const parsed = parseFloat(cleanedValue);
  
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};