"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings } from 'lucide-react';
// Removido: import { DialogDescription } from '@/components/ui/dialog'; // Importar DialogDescription

const UserProfile: React.FC = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-[hsl(var(--background))]">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]">Perfil do Usuário</h1>
      </div>
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
            <User className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
            Minhas Informações
          </CardTitle>
          {/* Removido: <DialogDescription>Visualize e edite suas informações de perfil e configurações da conta.</DialogDescription> */}
        </CardHeader>
        <CardContent>
          <p className="text-[hsl(var(--muted-foreground))]">
            Esta seção é dedicada às suas informações de perfil e configurações da conta.
          </p>
          <ul className="mt-4 space-y-2 text-[hsl(var(--muted-foreground))]">
            <li>- Editar dados pessoais</li>
            <li>- Gerenciar configurações de segurança</li>
            <li>- Personalizar preferências</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;