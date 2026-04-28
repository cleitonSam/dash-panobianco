export const calculateAdimplentesCount = (members: any[]): number => {
  let membersWithActiveStatus = 0;
  
  const nonStandardPlanKeywords = [
    'influenciador',
    'combo', // Mais geral para 'combo 3 diárias'
    'diaria', // Captura 'diárias' e outras variações
    'wellhub',
    'totalpass',
    'total pass', // Adicionado para capturar 'TOTAL PASS' com espaço
    'gurupass',
    'vip',
    'gympass',
    'cortesia', // Adicionado
    'teste',    // Adicionado
    'promocional', // Adicionado
    'free',     // Adicionado
    'gratis',      // Adicionado
  ];

  // Filtra os membros para incluir apenas planos "padrão" antes de contar os adimplentes.
  const filteredMembers = members.filter(member => {
    const planName = member.NomeContrato?.toLowerCase() || '';
    return !nonStandardPlanKeywords.some(keyword => planName.includes(keyword));
  });

  filteredMembers.forEach(member => {
    const status = member.StatusContrato?.toLowerCase() || '';
    if (status === 'ativo') {
      membersWithActiveStatus++;
    }
  });
  return membersWithActiveStatus;
};