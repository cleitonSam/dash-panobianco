"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Cake, CheckCircle, XCircle, Send, MessageSquare, Loader2 } from 'lucide-react';
import { format, parse, isSameDay, startOfDay, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWhatsApp, WhatsAppInstance } from '@/hooks/useWhatsApp'; // Importar useWhatsApp
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NoAnimationSelectContent } from './NoAnimationSelectContent';
import { showError, showSuccess } from '@/utils/toast';
import { MessageTemplateDialog } from './MessageTemplateDialog'; // Importar o novo componente
import { smartDelay } from '@/utils/delay'; // Importar a função de delay inteligente

interface BirthdaysTableProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  refetchMembers: () => void;
}

interface BirthdayMember {
  name: string;
  birthDate: Date;
  originalDateString: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed';
}

const BIRTHDAYS_PER_PAGE = 10; // Número de aniversariantes por página
const MESSAGE_DELAY_MS = 3000; // 3 segundos de atraso entre as mensagens

// NOVO: Array de variações para a mensagem de aniversário
const BIRTHDAY_MESSAGE_TEMPLATES = [
  (name: string) => `🎉 Parabéns, ${name}! A equipe Panobianco deseja a você um dia repleto de alegria e muita energia! Venha comemorar conosco! 🎂`,
  (name: string) => `🥳 Feliz Aniversário, ${name}! Que seu dia seja tão incrível quanto você! A Panobianco te deseja muita saúde e felicidade.`,
  (name: string) => `🎁 Hoje é o seu dia, ${name}! Toda a equipe Panobianco te deseja um aniversário maravilhoso, cheio de paz e novas conquistas.`,
  (name: string) => `🎈 Um brinde a você, ${name}! A Panobianco celebra mais um ano da sua vida com muita alegria. Que a felicidade te acompanhe sempre!`,
  (name: string) => `🌟 Parabéns, ${name}! Que este novo ciclo traga ainda mais força e determinação para seus treinos. Conte sempre com a Panobianco!`,
];

// Função para obter uma mensagem de aniversário aleatória
const getRandomBirthdayMessage = (name: string) => {
  const randomIndex = Math.floor(Math.random() * BIRTHDAY_MESSAGE_TEMPLATES.length);
  return BIRTHDAY_MESSAGE_TEMPLATES[randomIndex](name);
};


const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  const cleaned = String(phone).replace(/\D/g, '');
  // Adiciona o código do país (55) se não estiver presente e tiver pelo menos 8 dígitos
  if (cleaned.length >= 8 && !cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  return cleaned;
};

const StatusIndicator: React.FC<{ status: BirthdayMember['status'] }> = ({ status }) => {
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

export const BirthdaysTable: React.FC<BirthdaysTableProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
  refetchMembers,
}) => {
  const { fetchInstances, sendMessage } = useWhatsApp();
  const { data: instances } = fetchInstances;
  
  const connectedInstances = useMemo(() => {
    return instances?.filter(inst => inst.status === 'connected') || [];
  }, [instances]);

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>(
    connectedInstances.length > 0 ? connectedInstances[0].id : undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'pending' | 'sent' | 'failed'>>({});
  const [isSendingAll, setIsSendingAll] = useState(false);

  useEffect(() => {
    // Atualiza a instância selecionada se a lista mudar e a atual não estiver mais conectada
    if (!selectedInstanceId || !connectedInstances.find(i => i.id === selectedInstanceId)) {
      setSelectedInstanceId(connectedInstances.length > 0 ? connectedInstances[0].id : undefined);
    }
  }, [connectedInstances, selectedInstanceId]);

  const todayBirthdays = useMemo(() => {
    if (isLoadingMembers || !members || members.length === 0) return [];

    const today = startOfDay(new Date());
    const birthdays: BirthdayMember[] = [];

    members.forEach(member => {
      const birthDateString = member.DataNascimento;
      const memberName = member.Nome;
      const memberPhone = formatPhoneNumber(member.Celular);

      if (birthDateString && memberName && memberPhone !== 'N/A' && memberPhone.length >= 10) {
        try {
          const parsedDate = parse(birthDateString, 'dd/MM/yyyy', new Date());
          
          let thisYearBirthday = new Date(getYear(today), parsedDate.getMonth(), parsedDate.getDate());
          thisYearBirthday = startOfDay(thisYearBirthday);

          if (isSameDay(thisYearBirthday, today)) {
            birthdays.push({
              name: memberName,
              birthDate: thisYearBirthday,
              originalDateString: birthDateString,
              phone: memberPhone,
              status: sendingStatus[memberPhone] || 'pending',
            });
          }
        } catch (e) {
          // console.warn(`Could not parse birth date for member ${memberName}: ${birthDateString}`, e);
        }
      }
    });

    return birthdays.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar por nome
  }, [members, isLoadingMembers, sendingStatus]);

  const totalPages = Math.ceil(todayBirthdays.length / BIRTHDAYS_PER_PAGE);

  const paginatedBirthdays = useMemo(() => {
    const startIndex = (currentPage - 1) * BIRTHDAYS_PER_PAGE;
    const endIndex = startIndex + BIRTHDAYS_PER_PAGE;
    return todayBirthdays.slice(startIndex, endIndex);
  }, [todayBirthdays, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

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

    for (const member of todayBirthdays) {
      // NOVO: Usar a função para obter uma mensagem aleatória
      const message = getRandomBirthdayMessage(member.name.split(' ')[0]);
      
      try {
        // Simula o envio em massa sem a necessidade de abrir o modal
        await sendMessage.mutateAsync({ phone: member.phone, message });
        newStatus[member.phone] = 'sent';
        sentCount++;
      } catch (e) {
        newStatus[member.phone] = 'failed';
        failedCount++;
      }
      setSendingStatus(prev => ({ ...prev, ...newStatus })); // Atualiza o status a cada envio
      await smartDelay(sentCount + failedCount - 1); // Atraso inteligente anti-bloqueio
    }

    setIsSendingAll(false);
    if (failedCount === 0) {
      showSuccess(`Todas as ${sentCount} mensagens de aniversário foram enviadas com sucesso!`);
    } else {
      showError(`Envio concluído com ${sentCount} sucessos e ${failedCount} falhas.`);
    }
  };

  if (isLoadingMembers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (errorMembers) {
    return (
      <Card className="text-center p-6 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--danger-color))]">Erro ao Carregar Aniversariantes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[hsl(var(--muted-foreground))] mb-3 whitespace-pre-line">{errorMembers}</p>
          <Button onClick={() => refetchMembers()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isSending = isSendingAll || sendMessage.isPending;
  const canSend = connectedInstances.length > 0 && todayBirthdays.length > 0 && !isSending;

  return (
    <div className="space-y-6">
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--foreground))]">Configurações de Mensagens de Aniversário</CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))]">
            Selecione a instância de WhatsApp conectada para enviar as mensagens de felicitações.
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
                {isSendingAll ? 'Enviando...' : `Enviar para Todos (${todayBirthdays.length})`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--foreground))]">Aniversariantes de Hoje ({todayBirthdays.length})</CardTitle>
            <CardDescription className="text-[hsl(var(--muted-foreground))]">
              Alunos que fazem aniversário hoje.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {todayBirthdays.length > 0 ? (
            <div className="rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] text-[hsl(var(--text-color))] max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-[hsl(var(--secondary-black))] sticky top-0">
                  <TableRow>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Nome do Aluno</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Data de Nascimento</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Celular</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Status do Envio</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBirthdays.map((bday) => (
                    <TableRow key={bday.phone} className="border-b border-[hsl(var(--border-color))] hover:bg-[hsl(var(--secondary-black))]/50">
                      <TableCell className="font-medium text-[hsl(var(--foreground))]">{bday.name}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{bday.originalDateString}</TableCell>
                      <TableCell className="text-[hsl(var(--foreground))]">{bday.phone}</TableCell>
                      <TableCell>
                        <StatusIndicator status={sendingStatus[bday.phone] || 'pending'} />
                      </TableCell>
                      <TableCell>
                        <MessageTemplateDialog
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!selectedInstanceId || bday.status === 'sent' || isSending}
                              className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          }
                          recipientName={bday.name}
                          recipientPhone={bday.phone}
                          defaultMessageTemplate={getRandomBirthdayMessage} // NOVO: Passar a função de template aleatório
                          onMessageSent={handleMessageSent}
                          disabled={!selectedInstanceId || bday.status === 'sent' || isSending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Cake className="h-12 w-12 text-[hsl(var(--accent-turquoise))]" />
              <p className="mt-4 text-[hsl(var(--muted-foreground))]">Nenhum aniversariante encontrado para hoje.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Página {currentPage} de {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};