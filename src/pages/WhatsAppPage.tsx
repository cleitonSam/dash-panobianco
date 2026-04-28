"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  MessageSquare,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Smartphone,
  QrCode,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { WhatsAppInstanceForm } from "@/components/WhatsAppInstanceForm";
import { WhatsAppInstanceCard } from "@/components/WhatsAppInstanceCard";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const WhatsAppPage: React.FC = () => {
  const { fetchInstances } = useWhatsApp();
  const { data: instances, isLoading, isError, error, refetch } =
    fetchInstances;
  const [isNewInstanceDialogOpen, setIsNewInstanceDialogOpen] = useState(false);

  const handleInstanceCreated = () => {
    setIsNewInstanceDialogOpen(false);
    refetch();
  };

  const connectedCount =
    instances?.filter((inst) => inst.status === "connected").length || 0;
  const connectingCount =
    instances?.filter((inst) => inst.status === "connecting").length || 0;
  const disconnectedCount =
    instances?.filter((inst) => inst.status === "disconnected").length || 0;
  const canCreateNewInstance = connectedCount === 0;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-96 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <AlertCircle className="h-12 w-12 text-[hsl(var(--danger-color))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
          Erro ao Carregar Instâncias
        </h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md text-center">
          {error?.message}
        </p>
        <Button
          onClick={() => refetch()}
          className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              WhatsApp
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Conecte seu WhatsApp via QR Code para disparos automáticos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-[hsl(var(--border-color))] bg-[hsl(var(--input))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary-black))] hover:text-[hsl(var(--accent-turquoise))]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
          <Dialog
            open={isNewInstanceDialogOpen}
            onOpenChange={setIsNewInstanceDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={!canCreateNewInstance}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Instância
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
              <DialogHeader>
                <DialogTitle className="text-[hsl(var(--foreground))]">
                  Criar Nova Instância
                </DialogTitle>
                <DialogDescription className="text-[hsl(var(--muted-foreground))]">
                  Crie uma nova instância para conectar um número de WhatsApp.
                </DialogDescription>
              </DialogHeader>
              <WhatsAppInstanceForm onSuccess={handleInstanceCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glow-card border-[hsl(var(--border-color))]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success-color))]/15 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-[hsl(var(--success-color))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {connectedCount}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Conectadas
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glow-card border-[hsl(var(--border-color))]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--warning-color))]/15 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-[hsl(var(--warning-color))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {connectingCount}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Aguardando QR
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="glow-card border-[hsl(var(--border-color))]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--danger-color))]/15 flex items-center justify-center">
              <WifiOff className="h-5 w-5 text-[hsl(var(--danger-color))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {disconnectedCount}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Desconectadas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Limitação Alert */}
      {connectedCount > 0 && (
        <Alert
          variant="default"
          className="bg-[hsl(var(--warning-color))]/10 border-[hsl(var(--warning-color))]/40"
        >
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning-color))]" />
          <AlertTitle className="text-[hsl(var(--warning-color))]">
            Instância Ativa
          </AlertTitle>
          <AlertDescription className="text-[hsl(var(--foreground))]">
            Apenas uma instância de WhatsApp pode estar conectada por vez.
            Desconecte a instância atual antes de conectar outra.
          </AlertDescription>
        </Alert>
      )}

      {/* How it works (shown when no instances) */}
      {(!instances || instances.length === 0) && (
        <Card className="glow-card border-[hsl(var(--border-color))] border-dashed">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center mx-auto">
                <Smartphone className="h-8 w-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
                  Como Conectar seu WhatsApp
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-lg mx-auto">
                  Conecte seu WhatsApp em poucos passos para começar a enviar
                  mensagens automáticas.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))]">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))] font-bold">
                    1
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Crie uma Instância
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                    Clique em "Nova Instância" e dê um nome
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))]">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                    2
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Gere o QR Code
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                    Clique em "Conectar" para gerar o QR
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))]">
                  <div className="w-10 h-10 rounded-full bg-[hsl(var(--success-color))]/20 flex items-center justify-center text-[hsl(var(--success-color))] font-bold">
                    3
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    Escaneie com o Celular
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                    Abra WhatsApp {">"} Dispositivos vinculados {">"} Vincular
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsNewInstanceDialogOpen(true)}
                className="bg-green-600 text-white hover:bg-green-700"
                size="lg"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Criar Primeira Instância
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instances */}
      {instances && instances.length > 0 && (
        <Card className="glow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-400" />
                <CardTitle className="text-[hsl(var(--foreground))]">
                  Suas Instâncias ({instances.length})
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-green-500/40 text-green-400"
              >
                <Shield className="h-3 w-3 mr-1" />
                Conexão segura via QR Code
              </Badge>
            </div>
            <CardDescription className="text-[hsl(var(--muted-foreground))]">
              Gerencie a conexão dos seus números de WhatsApp. Escaneie o QR
              Code para conectar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <WhatsAppInstanceCard key={instance.id} instance={instance} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="glow-card border-[hsl(var(--border-color))]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))]/15 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                Dicas para manter a conexão estável
              </p>
              <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                <li>
                  Mantenha o celular conectado à internet e com bateria
                </li>
                <li>
                  Não desconecte o dispositivo vinculado no WhatsApp do celular
                </li>
                <li>
                  Em caso de desconexão, gere um novo QR Code e escaneie
                  novamente
                </li>
                <li>
                  Use a aba "Automações" para configurar disparos automáticos
                  após conectar
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppPage;
