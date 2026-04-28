"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cake, AlertCircle } from 'lucide-react';
import { BirthdaysTable } from '@/components/BirthdaysTable'; // Importar o novo componente de tabela
import { useOutletContext } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface BirthdaysPageContext {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  refetchMembers: () => void;
}

const BirthdaysPage: React.FC = () => {
  const { members, isLoadingMembers, errorMembers, refetchMembers } = useOutletContext<BirthdaysPageContext>();

  if (isLoadingMembers) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-10 w-96 mb-6" />
        <Card className="glow-card">
          <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorMembers) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
        <AlertCircle className="h-12 w-12 text-[hsl(var(--danger-color))]" />
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Erro ao Carregar Aniversariantes</h2>
        <p className="text-[hsl(var(--muted-foreground))] max-w-md text-center">{errorMembers}</p>
        <Button onClick={() => refetchMembers()} className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))]">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-[hsl(var(--background))]">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Aniversariantes</h1>
      </div>
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
            <Cake className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
            Próximos Aniversariantes
          </CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))]">
            Visualize os alunos que farão aniversário no mês atual e no próximo mês em formato de tabela.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BirthdaysTable 
            members={members} 
            isLoadingMembers={isLoadingMembers} 
            errorMembers={errorMembers} 
            refetchMembers={refetchMembers}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BirthdaysPage;