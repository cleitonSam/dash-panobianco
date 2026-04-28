"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { UserCheck, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AdimplentesListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[]; // Lista de membros adimplentes
}

export const AdimplentesListDialog: React.FC<AdimplentesListDialogProps> = ({ isOpen, onClose, members }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return members.filter(member =>
      member.Nome?.toLowerCase().includes(lowercasedSearchTerm) ||
      member.Celular?.toLowerCase().includes(lowercasedSearchTerm) ||
      member.Email?.toLowerCase().includes(lowercasedSearchTerm) ||
      member.NomeContrato?.toLowerCase().includes(lowercasedSearchTerm)
    );
  }, [members, searchTerm]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] h-[80vh] flex flex-col bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] text-[hsl(var(--text-color))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--foreground))] flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-[hsl(var(--primary))]" />
            Alunos Adimplentes ({members.length})
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--muted-foreground))]">
            Lista de todos os alunos com planos padrão e status 'ativo'.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Buscar por nome, celular, email ou contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[hsl(var(--input))] border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]"
          />
        </div>
        <ScrollArea className="flex-1 pr-4">
          {filteredMembers.length > 0 ? (
            <div className="rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] text-[hsl(var(--text-color))]">
              <Table>
                <TableHeader className="bg-[hsl(var(--secondary-black))] sticky top-0">
                  <TableRow>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Nome</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Celular</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Email</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Contrato</TableHead>
                    <TableHead className="text-[hsl(var(--accent-silver))]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, index) => (
                    <TableRow key={member.IDCliente || index} className="border-b border-[hsl(var(--border-color))] hover:bg-[hsl(var(--secondary-black))]/50">
                      <TableCell className="font-medium text-[hsl(var(--foreground))]">{member.Nome}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{member.Celular || 'N/A'}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{member.Email || 'N/A'}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">{member.NomeContrato || 'N/A'}</TableCell>
                      <TableCell className={cn(
                        "font-medium",
                        member.StatusContrato?.toLowerCase() === 'ativo' ? 'text-[hsl(var(--success-color))]' : 'text-[hsl(var(--danger-color))]'
                      )}>
                        {member.StatusContrato || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <UserCheck className="h-12 w-12 text-[hsl(var(--muted-foreground))]" />
              <p className="mt-4 text-[hsl(var(--muted-foreground))]">Nenhum aluno adimplente encontrado com o termo de busca.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};