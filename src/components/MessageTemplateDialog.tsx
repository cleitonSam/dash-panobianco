"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { showError, showSuccess } from '@/utils/toast';

interface MessageTemplateDialogProps {
  trigger: React.ReactNode;
  recipientName: string;
  recipientPhone: string;
  defaultMessageTemplate: (name: string) => string;
  onMessageSent: (phone: string) => void;
  disabled?: boolean;
}

export const MessageTemplateDialog: React.FC<MessageTemplateDialogProps> = ({
  trigger,
  recipientName,
  recipientPhone,
  defaultMessageTemplate,
  onMessageSent,
  disabled = false,
}) => {
  const { sendMessage } = useWhatsApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const firstName = recipientName.split(' ')[0];
  const initialMessage = defaultMessageTemplate(firstName);

  useEffect(() => {
    if (isDialogOpen) {
      setMessageContent(initialMessage);
    }
  }, [isDialogOpen, initialMessage]);

  // Este useEffect é crucial para a limpeza quando o componente é desmontado
  useEffect(() => {
    return () => {
      // Garante que o dialog seja fechado quando o componente é desmontado para prevenir problemas de portal
      setIsDialogOpen(false);
    };
  }, []);

  const handleSend = async () => {
    if (!messageContent.trim()) {
      showError("A mensagem não pode estar vazia.");
      return;
    }

    try {
      await sendMessage.mutateAsync({ phone: recipientPhone, message: messageContent });
      showSuccess(`Mensagem enviada para ${recipientName}!`);
      onMessageSent(recipientPhone);
      setIsDialogOpen(false);
    } catch (e) {
      // Erro já é tratado no hook
    }
  };

  // Garante que o trigger seja um elemento React válido antes de clonar
  const clonedTrigger = React.isValidElement(trigger)
    ? React.cloneElement(trigger, { disabled: disabled, key: `trigger-${recipientPhone}` })
    : null;

  return (
    <Dialog key={recipientPhone} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {clonedTrigger}
      </DialogTrigger>
      {isDialogOpen && ( // Renderiza condicionalmente o DialogContent
        <DialogContent className="sm:max-w-[500px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--foreground))]">Enviar Mensagem para {firstName}</DialogTitle>
            <DialogDescription className="text-[hsl(var(--muted-foreground))]">
              Edite o conteúdo da mensagem antes de enviar para {recipientPhone}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={8}
              className="bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]"
            />
            <Button
              onClick={handleSend}
              disabled={sendMessage.isPending || !messageContent.trim()}
              className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            >
              {sendMessage.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};