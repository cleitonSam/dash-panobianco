import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportToExcel } from '@/utils/export'; // Importa o novo utilitário

interface ExportToExcelButtonProps {
  data: any[] | undefined;
  fileName: string;
  buttonText: string;
  disabled?: boolean;
  className?: string;
  columnOrder?: string[]; // NOVA PROP
}

export const ExportToExcelButton: React.FC<ExportToExcelButtonProps> = ({
  data,
  fileName,
  buttonText,
  disabled = false,
  className,
  columnOrder, // NOVA PROP
}) => {
  const handleExport = () => {
    if (data) {
      exportToExcel({ data, fileName, columnOrder }); // Passa columnOrder para a função de exportação
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={disabled || !data || data.length === 0}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {buttonText}
    </Button>
  );
};