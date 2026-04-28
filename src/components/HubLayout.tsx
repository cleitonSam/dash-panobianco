"use client";

import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelLeft, Home, ListTodo, Target, User, Menu, TrendingUp, LogOut, Cake, MessageSquare, Zap } from 'lucide-react'; // Importar ícones
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
// Removido: import { UpcomingBirthdays } from './UpcomingBirthdays'; // Remover importação direta

interface HubLayoutProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
  refetchMembers: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Aniversariantes', path: '/birthdays', icon: Cake },
  { name: 'WhatsApp', path: '/whatsapp', icon: MessageSquare },
  { name: 'Automações', path: '/automacoes', icon: Zap },
  { name: 'Usuário', path: '/profile', icon: User },
];

export const HubLayout: React.FC<HubLayoutProps> = ({ members, isLoadingMembers, errorMembers, refetchMembers }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar para desktop */}
      <div className="hidden border-r border-[hsl(var(--border-color))] bg-[hsl(var(--secondary-black))] md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b border-[hsl(var(--border-color))] px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img 
                src="https://cdn.prod.website-files.com/67ec66139f8f56d61a1cd4c9/68a4974d9925b142d28aa8e5_Logo-Panobianco-original-claro.svg" 
                alt="Panobianco Logo" 
                className="h-8" 
              />
              {/* Panobianco */}
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[hsl(var(--muted-foreground))] transition-all hover:bg-[hsl(var(--card-bg))] hover:text-[hsl(var(--foreground))]",
                    location.pathname === item.path && "bg-[hsl(var(--card-bg))] text-[hsl(var(--primary))]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
              {/* Removido: UpcomingBirthdays direto da sidebar */}
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center justify-start gap-3 rounded-lg px-3 py-2 text-[hsl(var(--danger-color))] transition-all hover:text-[hsl(var(--danger-color))]/90 hover:bg-[hsl(var(--card-bg))] mt-4"
              >
                <LogOut className="h-4 w-4" />
                Sair do Sistema
              </Button>
            </nav>
          </div>
        </div>
      </div>

      {/* Conteúdo principal e navegação mobile */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden border-[hsl(var(--border-color))] bg-[hsl(var(--input))] text-[hsl(var(--foreground))]"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-[hsl(var(--secondary-black))] border-r border-[hsl(var(--border-color))]">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  to="#"
                  className="flex items-center gap-2 text-lg font-semibold text-[hsl(var(--foreground))]"
                >
                  <img 
                    src="https://cdn.prod.website-files.com/67ec66139f8f56d61a1cd4c9/68a4974d9925b142d28aa8e5_Logo-Panobianco-original-claro.svg" 
                    alt="Panobianco Logo" 
                    className="h-8" 
                  />
                  {/* Panobianco */}
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                      location.pathname === item.path && "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
                {/* Removido: UpcomingBirthdays direto do menu mobile */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-[hsl(var(--danger-color))] hover:text-[hsl(var(--danger-color))]/90 hover:bg-[hsl(var(--muted))] mt-4"
                >
                  <LogOut className="h-5 w-5" />
                  Sair do Sistema
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
        </header>
        <ScrollArea className="flex-1">
          <Outlet context={{ members, isLoadingMembers, errorMembers, refetchMembers }} /> {/* Passando o contexto aqui */}
        </ScrollArea>
      </div>
      
    </div>
  );
};