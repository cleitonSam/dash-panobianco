import jsPDF from 'jspdf';
import { format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency, parseCurrencyString } from './currency';
import { calculateAdimplentesCount } from './memberCalculations'; // Importar a função atualizada
import { supabase } from '@/integrations/supabase/client'; // Importar supabase

interface MonthlyStats {
  id: string;
  month_start_date: string;
  adimplentes_count: number;
  created_at: string;
}

interface ChartImage {
  id: string; // e.g., 'revenuePerContractChart', 'planTypeChart'
  dataUrl: string; // Base64 image data
}

interface PdfGeneratorOptions {
  members: any[];
  receivablesData: any[];
  monthlyStats: MonthlyStats[];
  prospectsData: any[];
  totalTransactionsCurrentMonth: number;
  totalPredictedRevenue: number; // NOVO: Adicionado faturamento previsto
  chartImages: ChartImage[];
}

// Helper function to calculate metrics from members data
const calculateMemberMetrics = (members: any[]) => {
  let totalWellhub = 0;
  let totalTotalPass = 0;
  let totalGurupass = 0;
  let delinquentMembersCount = 0;
  let totalDelinquentRevenue = 0;
  let membersWithActiveStatusForStandardPlans = 0; // Renomeado para clareza
  let totalStandardPlansMembers = 0;

  const nonStandardPlanKeywords = [
    'influenciador',
    'combo', // Mais geral
    'diaria', // Captura 'diárias'
    'wellhub',
    'totalpass',
    'gurupass',
    'vip',
    'gympass',
    'anual', // Adicionado para exclusão
    'cortesia', // Adicionado
    'teste',    // Adicionado
    'promocional', // Adicionado
    'free',     // Adicionado
    'gratis',      // Adicionado
  ];

  members.forEach(member => {
    const planName = member.NomeContrato?.toLowerCase() || '';
    const status = member.StatusContrato?.toLowerCase() || ''; // CORRIGIDO: Usar StatusContrato
    const contractValue = parseCurrencyString(member.ValorContrato);

    // Count Wellhub/Gympass, TotalPass, Gurupass from ALL members
    if (planName.includes('wellhub') || planName.includes('gympass')) {
      totalWellhub++;
    }
    if (planName.includes('totalpass')) {
      totalTotalPass++;
    }
    if (planName.includes('gurupass')) {
      totalGurupass++;
    }

    // Identify and count members with "standard" plans
    const isStandardPlan = !nonStandardPlanKeywords.some(keyword => planName.includes(keyword));

    if (isStandardPlan) {
      totalStandardPlansMembers++; // Total de alunos com planos padrão
      if (status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado')) {
        delinquentMembersCount++; // Inadimplentes entre os planos padrão
        totalDelinquentRevenue += contractValue; // Faturamento inadimplente dos planos padrão
      }
      if (status === 'ativo') { // Alterado para correspondência exata
        membersWithActiveStatusForStandardPlans++; // Adimplentes entre os planos padrão
      }
    }
  });

  return {
    totalWellhub,
    totalTotalPass,
    totalGurupass,
    delinquentMembersCount,
    totalDelinquentRevenue,
    membersWithActiveStatus: membersWithActiveStatusForStandardPlans, // Adimplentes (planos padrão)
    totalActiveMembers: totalStandardPlansMembers, // Total de alunos com planos padrão
  };
};

const calculateGrossRevenue = (receivablesData: any[]) => {
  return receivablesData.reduce((sum, item) => sum + parseCurrencyString(item.Valor), 0);
};

export const generateDashboardPdf = async ({
  members,
  receivablesData,
  monthlyStats,
  prospectsData,
  totalTransactionsCurrentMonth,
  totalPredictedRevenue, // NOVO: Receber o faturamento previsto
  chartImages,
}: PdfGeneratorOptions) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let y = 10;

  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 7;
  const sectionSpacing = 10;

  const primaryColor = '#FF5A00';
  const secondaryColor = '#333333';
  const textColor = '#333333';
  const mutedTextColor = '#666666';
  const dangerColor = '#dc3545';
  const successColor = '#FF5A00';

  // REMOVIDO: Busca do logo via Edge Function

  const { 
    totalWellhub, 
    totalTotalPass,
    totalGurupass,
    delinquentMembersCount, 
    membersWithActiveStatus, // Este agora é o count de adimplentes de planos padrão
  } = calculateMemberMetrics(members);
  
  const totalGrossRevenue = calculateGrossRevenue(receivablesData);
  const adimplentesCount = membersWithActiveStatus; // Usando a métrica de planos padrão

  const addHeaderAndFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(10);
    doc.setTextColor(mutedTextColor);
    
    // REMOVIDO: Adição do logo
    
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }), pageWidth - margin, 10, { align: 'right' });
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  const checkNewPage = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin + 10;
    }
  };

  const getFriendlyTitle = (id: string) => {
    switch (id) {
      case 'keyMetrics': return 'Métricas Chave do Dashboard';
      case 'monthlyAdherenceTracker': return 'Adesão Mensal de Alunos';
      case 'prospectsDashboard': return 'Oportunidades e Conversão de Prospects';
      case 'overviewMetricCards': return 'Métricas Adicionais (Visão Geral)';
      case 'statusCards': return 'Resumo de Status dos Contratos';
      case 'memberSummaryCards': return 'Resumo de Planos de Alunos';
      case 'memberRevenueSummary': return 'Faturamento Total (Contratos Adimplentes)';
      case 'delinquentRevenueSummary': return 'Faturamento Inadimplente';
      case 'grossRevenueDashboard': return 'Faturamento Geral (Bruto)';
      case 'receivablesDashboard': return 'Dashboard de Recebíveis';
      case 'annualDashboard': return 'Dashboard de Planos Anuais';
      case 'personalDashboard': return 'Dashboard de Planos Personal';
      case 'onlineSalesDashboard': return 'Dashboard de Vendas Online';
      case 'revenuePerContractChart': return 'Faturamento por Tipo de Contrato (Top 10)';
      case 'membersPerContractChart': return 'Alunos por Tipo de Contrato (Top 10)';
      case 'planTypeChart': return 'Distribuição de Alunos por Tipo de Plano';
      case 'contractStatusChart': return 'Distribuição por Status dos Contratos';
      case 'frequencyDashboard': return 'Dashboard de Frequência (Wellhub/TotalPass)';
      default: return id.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    }
  };

  y = 20;
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("Relatório de Análise Panobianco", pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor);
  doc.text("Visão Geral de Performance e Gestão de Alunos", pageWidth / 2, y, { align: 'center' });
  y += 15;

  checkNewPage(lineHeight * 8 + sectionSpacing);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor);
  doc.text("Métricas Chave de Performance", margin, y);
  y += lineHeight;

  const col1 = margin;
  const col2 = margin + contentWidth / 2;
  const rowHeight = 8;
  const boxWidth = contentWidth / 2 - 5;
  const boxHeight = rowHeight * 2;
  
  const drawMetricBox = (x: number, y: number, title: string, value: string, color: string) => {
    doc.setFillColor(242, 242, 242);
    doc.rect(x, y, boxWidth, boxHeight, 'F');
    doc.setDrawColor(color);
    doc.setLineWidth(0.5);
    doc.line(x, y, x, y + boxHeight);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(mutedTextColor);
    doc.text(title, x + 3, y + 4);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(color);
    doc.text(value, x + 3, y + 12);
  };

  // NOVO: Adicionando o Faturamento Previsto
  drawMetricBox(col1, y, "Faturamento Previsto (Contratos Adimplentes)", formatCurrency(totalPredictedRevenue), primaryColor);
  drawMetricBox(col2, y, "Faturamento Total Bruto (Recebíveis)", formatCurrency(totalGrossRevenue), primaryColor);
  y += boxHeight + 5;

  drawMetricBox(col1, y, "Total de Transações (Mês)", totalTransactionsCurrentMonth.toLocaleString('pt-BR'), successColor);
  drawMetricBox(col2, y, "Alunos Adimplentes (Planos Padrão)", adimplentesCount.toLocaleString('pt-BR'), successColor);
  y += boxHeight + 5;

  drawMetricBox(col1, y, "Total de Inadimplentes/Vencidos/Cancelados", delinquentMembersCount.toLocaleString('pt-BR'), dangerColor);
  drawMetricBox(col2, y, "Alunos Wellhub (incl. Gympass)", totalWellhub.toLocaleString('pt-BR'), secondaryColor);
  y += boxHeight + 5;

  drawMetricBox(col1, y, "Alunos TotalPass", totalTotalPass.toLocaleString('pt-BR'), secondaryColor);
  drawMetricBox(col2, y, "Alunos Gurupass", totalGurupass.toLocaleString('pt-BR'), secondaryColor);
  y += boxHeight + sectionSpacing;


  if (chartImages.length > 0) {
    for (const chart of chartImages) {
      if (!chart.dataUrl) {
        console.warn(`[PDF Generator] Pulando gráfico ${chart.id} por dataUrl vazio.`);
        continue;
      }

      let loadedImage: HTMLImageElement | null = null;
      try {
        loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error(`[PDF Generator] Falha ao carregar imagem para o gráfico ${chart.id} do Base64:`, e);
            reject(new Error(`Falha ao carregar imagem para o gráfico ${chart.id}`));
          };
          img.src = chart.dataUrl;
        });
      } catch (e) {
        console.error(`[PDF Generator] Erro durante o carregamento da imagem para o gráfico ${chart.id}:`, e);
        loadedImage = null;
      }

      if (!loadedImage || loadedImage.width === 0 || loadedImage.height === 0) {
        console.warn(`[PDF Generator] Pulando gráfico ${chart.id} por falha no carregamento da imagem.`);
        continue;
      }

      const imgWidth = contentWidth;
      const imgHeight = (loadedImage.height * imgWidth) / loadedImage.width;

      checkNewPage(lineHeight * 2 + imgHeight + sectionSpacing);

      doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor);
    doc.text(getFriendlyTitle(chart.id), margin, y);
    y += lineHeight + 3;

    const imagePadding = 3;
    doc.setFillColor(242, 242, 242);
    doc.rect(margin - imagePadding, y - imagePadding, imgWidth + 2 * imagePadding, imgHeight + 2 * imagePadding, 'F');
    doc.setDrawColor(229, 229, 229);
    doc.setLineWidth(0.2);
    doc.rect(margin - imagePadding, y - imagePadding, imgWidth + 2 * imagePadding, imgHeight + 2 * imagePadding, 'S');

    doc.addImage(chart.dataUrl, 'PNG', margin, y, imgWidth, imgHeight);
    y += imgHeight + sectionSpacing;
    }
  }

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, totalPages);
  }

  return doc;
};