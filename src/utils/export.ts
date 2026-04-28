import * as xlsx from 'xlsx';
import { showSuccess } from './toast';

interface ExportToExcelOptions {
  data: any[];
  fileName: string;
  columnOrder?: string[]; // Novo parâmetro opcional
}

export const exportToExcel = ({ data, fileName, columnOrder }: ExportToExcelOptions) => {
  if (!data || data.length === 0) {
    // console.warn("Exportação cancelada: não há dados para exportar.");
    return;
  }

  // Se columnOrder for fornecido, use-o para definir o cabeçalho e a ordem das colunas
  const worksheet = xlsx.utils.json_to_sheet(data, { header: columnOrder });

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Dados');

  // Adiciona um timestamp ao nome do arquivo para torná-lo único
  const date = new Date();
  const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
  const finalFileName = `${fileName}_${timestamp}.xlsx`;

  xlsx.writeFile(workbook, finalFileName);
  showSuccess(`Planilha "${finalFileName}" gerada com sucesso!`);
};