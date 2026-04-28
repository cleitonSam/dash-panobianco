import React, { useMemo, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExportToExcelButton } from './ExportToExcelButton';
import { UserX, Send, MessageSquare, XCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NoAnimationSelectContent } from './NoAnimationSelectContent';
import { showError, showSuccess } from '@/utils/toast';
import { MessageTemplateDialog } from './MessageTemplateDialog'; // Importar o novo componente
import { smartDelay } from '@/utils/delay'; // Importar a função de delay inteligente

interface Member {
  ID: string;
  CPF: string;
  Nome: string;
  Celular: string;
  Contrato: string;
  Status: string;
  phoneKey: string;
}

interface DelinquentMembersTableProps {
  members: any[];
}

const MESSAGE_DELAY_MS = 3000; // 3 segundos de atraso entre as mensagens

// NOVO: Array de variações para a mensagem de cobrança
const DELINQUENT_MESSAGE_TEMPLATES = [
  (name: string) => `Olá ${name}, notamos que seu contrato na Panobianco está com status de inadimplente/vencido. Por favor, regularize sua situação o mais breve possível para evitar a suspensão dos serviços. Entre em contato conosco!`,
  (name: string) => `Prezado(a) ${name}, identificamos um débito pendente em seu contrato com a Panobianco. Para evitar interrupções, pedimos que entre em contato para regularizar.`,
  (name: string) => `Atenção, ${name}! Seu plano na Panobianco está com pagamentos em atraso. Gostaríamos de ajudar a resolver isso. Por favor, nos procure para mais informações.`,
  (name: string) => `Oi ${name}, seu acesso à Panobianco pode ser suspenso devido a pendências financeiras. Regularize seu contrato o quanto antes para continuar aproveitando nossos serviços!`,
  (name: string) => `Lembrete importante, ${name}: Seu contrato na Panobianco apresenta status de inadimplência. Entre em contato com nossa equipe para regularizar e evitar maiores transtornos.`,
];

// Função para obter uma mensagem de cobrança aleatória
const getRandomDelinquentMessage = (name: string) => {
  const randomIndex = Math.floor(Math.random() * DELINQUENT_MESSAGE_TEMPLATES.length);
  return DELINQUENT_MESSAGE_TEMPLATES[randomIndex](name);
};

const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length >= 8 && !cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  return cleaned;
};

const StatusIndicator: React.FC<{ status: 'pending' | 'sent' | 'failed' }> = ({ status }) => {
  switch (status) {
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-[hsl(var(--success-color))]" title="Enviado" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-[hsl(var(--danger-color))]" title="Falha no Envio" />;
    case 'pending':
    default:
      return <span className="text-[hsl(var(--muted-foreground))]">-</span>;
  }
};

export const DelinquentMembersTable: React.FC<DelinquentMembersTableProps> = ({ members }) => {
  const { fetchInstances, sendMessage } = useWhatsApp();
  const { data: instances } = fetchInstances;
  
  const connectedInstances = useMemo(() => {
    return instances?.filter(inst => inst.status === 'connected') || [];
  }, [instances]);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(
    connectedInstances.length > 0 ? connectedInstances[0].id : undefined
  );
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'pending' | 'sent' | 'failed'>>({});
  const [isSendingAll, setIsSendingAll] = useState(false);

  useEffect(() => {
    if (!selectedInstanceId || !connectedInstances.find(i => i.id === selectedInstanceId)) {
      setSelectedInstanceId(connectedInstances.length > 0 ? connectedInstances[0].id : undefined);
    }
  }, [connectedInstances, selectedInstanceId]);

  const delinquentMembers: Member[] = useMemo(() => {
    if (!members) return [];
    const filtered = members
      .filter(member => {
        const status = member.StatusContrato?.toLowerCase() || '';
        return status.includes('inadimplente') || status.includes('vencido') || status.includes('cancelado');
      })
      .map(member => {
        // Extração mais robusta para ID e CPF
        const memberId = (member.IDCliente || member.IdCliente || member.idcliente || '').toString().trim() || 'N/A';
        const memberCpf = (member.CPF || member.cpf || member.Cpf || member.Documento || member.documento || member.NumeroDocumento || member.numeroDocumento || '').toString().trim() || 'N/A';
        
        return {
          ID: memberId,
          CPF: memberCpf,
          Nome: member.Nome,
          Contrato: member.NomeContrato,
          Celular: formatPhoneNumber(member.Celular),
          Status: member.StatusContrato,
          phoneKey: formatPhoneNumber(member.Celular),
        };
      })
      .filter(member => member.Celular !== 'N/A' && member.Celular.length >= 10); // Filtra telefones inválidos
    return filtered;
  }, [members]);

  // Define a ordem das colunas desejada para a exportação do Excel
  const excelColumnOrder = ['ID', 'CPF', 'Nome', 'Contrato', 'Celular', 'Status'];

  const handleMessageSent = (phone: string) => {
    setSendingStatus(prev => ({ ...prev, [phone]: 'sent' }));
  };

  const handleSendAllMessages = async () => {
    if (!selectedInstanceId) {
      showError("Selecione uma instância de WhatsApp conectada.");
      return;
    }
    
    setIsSendingAll(true);
    let sentCount = 0;
    let failedCount = 0;
    const newStatus: Record<string, 'pending' | 'sent' | 'failed'> = {};

    for (const member of delinquentMembers) {
      // NOVO: Usar a função para obter uma mensagem aleatória
      const message = getRandomDelinquentMessage(member.Nome.split(' ')[0]);
      
      try {
        // Simula o envio em massa sem a necessidade de abrir o modal
        await sendMessage.mutateAsync({ phone: member.Celular, message });
        newStatus[member.Celular] = 'sent';
        sentCount++;
      } catch (e) {
        newStatus[member.Celular] = 'failed';
        failedCount++;
      }
      setSendingStatus(prev => ({ ...prev, ...newStatus }));
      await smartDelay(sentCount + failedCount - 1); // Atraso inteligente anti-bloqueio
    }

    setIsSendingAll(false);
    if (failedCount === 0) {
      showSuccess(`Todas as ${sentCount} mensagens de cobrança foram enviadas com sucesso!`);
    } else {
      showError(`Envio concluído com ${sentCount} sucessos e ${failedCount} falhas.`);
    }
  };

  const isSending = isSendingAll || sendMessage.isPending;
  const canSend = connectedInstances.length > 0 && delinquentMembers.length > 0 && !isSending;

  return (
    <div className="space-y-6">
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--foreground))]">Configurações de Mensagens em Massa</CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))]">
            Selecione a instância de WhatsApp conectada para enviar mensagens de cobrança aos inadimplentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedInstances.length === 0 ? (
            <Alert variant="destructive" className="bg-[hsl(var(--danger-color))]/20 border-[hsl(var(--danger-color))] text-[hsl(var(--danger-color))]">
              <XCircle className="h-4 w-4" />
              <AlertTitle className="text-[hsl(var(--danger-color))]">Instância Desconectada!</AlertTitle>
              <AlertDescription>
                Nenhuma instância de WhatsApp está conectada. Conecte uma na aba "WhatsApp" para enviar mensagens.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Select 
                value={selectedInstanceId} 
                onValueChange={setSelectedInstanceId}
                disabled={isSending}
              >
                <SelectTrigger className="w-[250px] bg-[hsl(var(--background))] border-[hsl(var(--input))] shadow-md">
                  <SelectValue placeholder="Selecione a Instância" />
                </SelectTrigger>
                <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] shadow-lg">
                  {connectedInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.instance_name} ({instance.phone || 'N/A'})
                    </SelectItem>
                  ))}
                </NoAnimationSelectContent>
              </Select>
              <Button
                onClick={handleSendAllMessages}
                disabled={!canSend}
                className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
              >
                {isSendingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSendingAll ? 'Enviando...' : `Enviar para Todos (${delinquentMembers.length})`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--foreground))]">Lista de Inadimplentes ({delinquentMembers.length})</CardTitle>
            <CardDescription className="text-[hsl(var(--muted-foreground))]">
              Alunos com status de contrato inadimplente, vencido ou cancelado.
            </CardDescription>
          </div>
          <ExportToExcelButton
            data={delinquentMembers}
            fileName="relatorio_inadimplentes"
            buttonText="Exportar Inadimplentes"
            columnOrder={excelColumnOrder} // Passa a ordem das colunas definida
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          />
        </CardHeader>
        <CardContent>
          {delinquentMembers.length > 0 ? (
            <div className="rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] text-[hsl(var(--text-color))] max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-[hsl(var(--secondary-black))] sticky top-0">
                  <TableRow>
                    <TableHead className="text-[hsl(var(--accent-silver))]">ID</TableHead> {/* Adicionado cabeçalho ID */}
                    <TableHead className="text-[hsl(var(--accent-silver))]">CPF</TableHead> {/* Adicionado cabeçalho CPF */}
                    <TableHead className="text-[hsl(var(--accent-silver))]">Nome</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Contrato</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Celular</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Status Contrato</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Status do Envio</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delinquentMembers.map((member) => (
                    <TableRow key={member.phoneKey} className="border-b border-[hsl(var(--border-color))] hover:bg-[hsl(var(--secondary-black))]/50">
                      <TableCell className="font-medium text-[hsl(var(--text-color))]">{member.ID}</TableCell> {/* Exibe ID */}
                      <TableCell className="font-medium text-[hsl(var(--text-color))]">{member.CPF}</TableCell> {/* Exibe CPF */}
                      <TableCell className="font-medium text-[hsl(var(--text-color))]">{member.Nome}</TableCell>
                      <TableCell className="text-[hsl(var(--text-color))]">{member.Contrato}</TableCell>
                      <TableCell className="text-[hsl(var(--text-color))]">{member.Celular}</TableCell>
                      <TableCell className="text-[hsl(var(--danger-color))]">{member.Status}</TableCell>
                      <TableCell>
                        <StatusIndicator status={sendingStatus[member.phoneKey] || 'pending'} />
                      </TableCell>
                      <TableCell>
                        <MessageTemplateDialog
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!selectedInstanceId || sendingStatus[member.phoneKey] === 'sent' || isSending}
                              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          }
                          recipientName={member.Nome}
                          recipientPhone={member.Celular}
                          defaultMessageTemplate={getRandomDelinquentMessage} // NOVO: Passar a função de template aleatório
                          onMessageSent={handleMessageSent}
                          disabled={!selectedInstanceId || sendingStatus[member.phoneKey] === 'sent' || isSending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <UserX className="h-12 w-12 text-[hsl(var(--success-color))]" />
              <p className="mt-4 text-[hsl(var(--muted-foreground))]">Nenhum aluno inadimplente encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};