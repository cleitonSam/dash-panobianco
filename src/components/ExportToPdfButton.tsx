import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { generateDashboardPdf } from '@/utils/pdfGenerator'; // Import the new generator
import html2canvas from 'html2canvas'; // Import html2canvas

interface ChartRef {
  id: string;
  ref: React.RefObject<HTMLElement>;
}

interface ExportToPdfButtonProps {
  members: any[]; // Pass members data
  receivablesData: any[]; // Pass receivables data
  monthlyStats: any[]; // Pass monthly stats
  prospectsData: any[]; // Pass prospects data
  totalTransactionsCurrentMonth: number; // NOVO: Passar o total de transações
  totalPredictedRevenue: number; // NOVO: Adicionado faturamento previsto
  chartRefs: ChartRef[]; // New: Array of chart images
  fileName?: string;
  buttonText?: string;
  className?: string;
}

export const ExportToPdfButton: React.FC<ExportToPdfButtonProps> = ({
  members,
  receivablesData,
  monthlyStats,
  prospectsData,
  totalTransactionsCurrentMonth, // NOVO: Receber o total de transações
  totalPredictedRevenue, // NOVO: Receber o faturamento previsto
  chartRefs, // New: Receive chart refs
  fileName = 'relatorio_panobianco_profissional.pdf',
  buttonText = 'Exportar para PDF',
  className,
}) => {
  const handleExport = async () => {
    showSuccess("Gerando PDF profissional... Isso pode levar alguns segundos.");

    try {
      const chartImages = await Promise.all(
        chartRefs.map(async (chartRef) => {
          if (chartRef.ref.current) {
            try {
              // Forçar a renderização do componente para garantir que ele tenha dimensões corretas
              // Aumentar a escala para melhor qualidade e garantir que o fundo seja branco
              const canvas = await html2canvas(chartRef.ref.current, {
                scale: 3, // Aumentado para 3 para melhor resolução
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF', // Fundo branco explícito
                // Adicionar altura e largura para garantir que o conteúdo não seja cortado
                width: chartRef.ref.current.offsetWidth,
                height: chartRef.ref.current.offsetHeight + 50, // Adicionar 50px de buffer na altura
              });
              return { id: chartRef.id, dataUrl: canvas.toDataURL('image/png') };
            } catch (captureError) {
              console.error(`[PDF Error] Falha ao capturar o gráfico com ID: ${chartRef.id}`, captureError);
              // Retorna uma imagem vazia para não quebrar o Promise.all, mas registra o erro
              return { id: chartRef.id, dataUrl: '' }; 
            }
          }
          return { id: chartRef.id, dataUrl: '' }; // Fallback
        })
      );

      const doc = await generateDashboardPdf({
        members,
        receivablesData,
        monthlyStats,
        prospectsData,
        totalTransactionsCurrentMonth, // NOVO: Passar para o gerador
        totalPredictedRevenue, // NOVO: Passar o faturamento previsto
        chartImages: chartImages.filter(img => img.dataUrl !== ''), // Filter out empty images
      });
      doc.save(fileName);
      showSuccess("PDF profissional gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF profissional:", error);
      showError("Falha ao gerar o PDF profissional. Verifique o console para detalhes.");
    }
  };

  return (
    <Button onClick={handleExport} className={className}>
      <FileText className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
};