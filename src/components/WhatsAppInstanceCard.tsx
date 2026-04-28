"use client";

import React, { useState, useEffect } from 'react';
import { WhatsAppInstance, useWhatsApp } from '@/hooks/useWhatsApp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, QrCode, CheckCircle, XCircle, RefreshCw, Trash, Plug, MessageSquare, Edit, Image as ImageIcon } from 'lucide-react'; // Adicionado Edit e Image
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Importar Avatar
import { WhatsAppInstanceForm } from './WhatsAppInstanceForm'; // Importar o formulário para edição

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
}

const getStatusColor = (status: WhatsAppInstance['status']) => {
  switch (status) {
    case 'connected': return 'bg-[hsl(var(--success-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--success-color))]/90';
    case 'connecting': return 'bg-[hsl(var(--warning-color))] text-[hsl(var(--primary-black))] hover:bg-[hsl(var(--warning-color))]/90';
    case 'disconnected': return 'bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90';
    default: return 'bg-[hsl(var(--pending-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--pending-color))]/90';
  }
};

const getStatusIcon = (status: WhatsAppInstance['status']) => {
  switch (status) {
    case 'connected': return <CheckCircle key="connected-icon" className="h-4 w-4" />;
    case 'connecting': return <Loader2 key="connecting-icon" className="h-4 w-4 animate-spin" />;
    case 'disconnected': return <XCircle key="disconnected-icon" className="h-4 w-4" />;
    default: return <Plug key="default-icon" className="h-4 w-4" />;
  }
};

export const WhatsAppInstanceCard: React.FC<WhatsAppInstanceCardProps> = ({ instance }) => {
  const { connectInstance, checkInstanceStatus, disconnectInstance, deleteInstance } = useWhatsApp();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // Estado para o modal de edição
  // Removido: const [phoneInput, setPhoneInput] = useState('');
  // Removido: const [usePairingCode, setUsePairingCode] = useState(false);

  const isConnecting = connectInstance.isPending || checkInstanceStatus.isPending;
  const isConnected = instance.status === 'connected';
  const needsConnection = instance.status === 'disconnected';
  const isAwaitingCode = instance.status === 'connecting' && (instance.qr_code_base64 || instance.pairing_code);

  // Simplificado para sempre iniciar a conexão sem telefone (QR Code)
  const handleConnect = async () => {
    try {
      await connectInstance.mutateAsync({ instanceId: instance.id, phone: undefined });
      setIsConnectDialogOpen(false);
    } catch (e) {
      // Error handled by hook
    }
  };

  const handleCheckStatus = () => {
    checkInstanceStatus.mutate(instance.id);
  };

  const handleDisconnect = () => {
    disconnectInstance.mutate(instance.id);
  };

  const handleDelete = () => {
    deleteInstance.mutate(instance.id);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
  };

  // Auto-check status if currently connecting
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAwaitingCode) {
      interval = setInterval(() => {
        checkInstanceStatus.mutate(instance.id);
      }, 15000); // Check every 15 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAwaitingCode, instance.id, checkInstanceStatus]);

  return (
    <Card className="glow-card flex flex-col justify-between h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-[hsl(var(--border-color))]">
            <AvatarImage src={instance.avatar_url || undefined} alt="Avatar da Instância" />
            <AvatarFallback className="bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
              <ImageIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-[hsl(var(--foreground))]">{instance.instance_name}</CardTitle>
            <CardDescription className="text-sm text-[hsl(var(--muted-foreground))]">
              {instance.phone ? `Telefone: ${instance.phone}` : 'Telefone não registrado'}
            </CardDescription>
          </div>
        </div>
        <Badge className={cn("flex items-center gap-1", getStatusColor(instance.status))}>
          {getStatusIcon(instance.status)}
          <span key="status-text">{instance.status.charAt(0).toUpperCase() + instance.status.slice(1)}</span>
        </Badge>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center pt-4 flex-grow">
        {isAwaitingCode && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Aguardando Conexão</h3>
            
            {instance.qr_code_base64 && (
              <div className="p-4 bg-white rounded-lg shadow-inner border border-[hsl(var(--border-color))]">
                <img 
                  src={instance.qr_code_base64}
                  alt="QR Code" 
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Escaneie com o WhatsApp no seu celular.</p>
              </div>
            )}

            {instance.pairing_code && (
              <div className="p-4 bg-[hsl(var(--muted))] rounded-lg shadow-inner border border-[hsl(var(--border-color))]">
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Código de Pareamento:</p>
                <p className="text-2xl font-bold text-[hsl(var(--primary))] tracking-widest">{instance.pairing_code}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Use este código para parear o dispositivo.</p>
              </div>
            )}

            {!instance.qr_code_base64 && !instance.pairing_code && (
              <div className="text-center space-y-2">
                <Loader2 className="h-12 w-12 text-[hsl(var(--warning-color))] mx-auto animate-spin" />
                <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Gerando Código...</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Aguarde um momento enquanto o código é gerado pela API.</p>
              </div>
            )}
          </div>
        )}
        
        {isConnected && (
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-[hsl(var(--success-color))] mx-auto" />
            <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Conectado!</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Pronto para enviar mensagens.</p>
          </div>
        )}

        {needsConnection && (
          <div className="text-center space-y-2">
            <XCircle className="h-12 w-12 text-[hsl(var(--danger-color))] mx-auto" />
            <p className="text-lg font-semibold text-[hsl(var(--foreground))]">Desconectado</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Inicie a conexão abaixo.</p>
          </div>
        )}
      </CardContent>

      <div className="p-6 pt-0 border-t border-[hsl(var(--border-color))] flex flex-wrap gap-2 justify-end">
        {isConnected && (
          <Button 
            onClick={handleDisconnect} 
            variant="outline" 
            disabled={disconnectInstance.isPending}
            className="bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90 border-[hsl(var(--danger-color))]"
          >
            {disconnectInstance.isPending ? (
              <span key="loading-disconnect" className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desconectando...
              </span>
            ) : (
              <span key="default-disconnect" className="flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                Desconectar
              </span>
            )}
          </Button>
        )}

        {isAwaitingCode && (
          <Button 
            onClick={handleCheckStatus} 
            variant="outline" 
            disabled={isConnecting}
            className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 border-[hsl(var(--border-color))]"
          >
            {isConnecting ? (
              <span key="loading-check" className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </span>
            ) : (
              <span key="default-check" className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Verificar Status
              </span>
            )}
          </Button>
        )}

        {needsConnection && (
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90">
                <Plug className="mr-2 h-4 w-4" /> Conectar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
              <DialogHeader>
                <DialogTitle className="text-[hsl(var(--foreground))]">Iniciar Conexão</DialogTitle>
                <DialogDescription className="text-[hsl(var(--muted-foreground))]">
                  Escaneie o QR Code para conectar sua instância de WhatsApp.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button 
                  onClick={() => handleConnect()} 
                  disabled={isConnecting}
                  className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
                >
                  {isConnecting ? (
                    <span key="loading-connect" className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </span>
                  ) : (
                    <span key="default-connect" className="flex items-center">
                      <QrCode className="mr-2 h-4 w-4" />
                      Gerar QR Code
                    </span>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[hsl(var(--accent-turquoise))] hover:bg-[hsl(var(--muted))]/50">
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
            <DialogHeader>
              <DialogTitle className="text-[hsl(var(--foreground))]">Editar Instância</DialogTitle>
              <DialogDescription className="text-[hsl(var(--muted-foreground))]">
                Atualize os detalhes da sua instância de WhatsApp.
              </DialogDescription>
            </DialogHeader>
            <WhatsAppInstanceForm 
              onSuccess={handleEditSuccess} 
              defaultValues={instance} 
              isEditing={true} 
            />
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[hsl(var(--danger-color))] hover:bg-[hsl(var(--muted))]/50">
              <Trash className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[hsl(var(--foreground))]">Excluir Instância?</AlertDialogTitle>
              <AlertDialogDescription className="text-[hsl(var(--muted-foreground))]">
                Esta ação excluirá permanentemente a instância "{instance.instance_name}" do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[hsl(var(--secondary-black))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--secondary-black))]/80 hover:text-[hsl(var(--accent-white))] border-[hsl(var(--border-color))]">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-[hsl(var(--danger-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--danger-color))]/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};