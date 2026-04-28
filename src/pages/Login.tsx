"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/'); // Redireciona para o dashboard após o login
      }
    });

    // Limpa o listener ao desmontar o componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-[hsl(var(--card-bg))] rounded-lg shadow-lg border border-[hsl(var(--border-color))]">
        <h2 className="text-2xl font-bold text-center text-[hsl(var(--foreground))]">Bem-vindo de volta!</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: `hsl(var(--primary))`,
                  brandAccent: `hsl(var(--primary-foreground))`,
                  inputBackground: `hsl(var(--background))`,
                  inputBorder: `hsl(var(--border))`,
                  inputBorderHover: `hsl(var(--ring))`,
                  inputBorderFocus: `hsl(var(--ring))`,
                  inputText: `hsl(var(--foreground))`,
                  defaultButtonBackground: `hsl(var(--primary))`,
                  defaultButtonBackgroundHover: `hsl(var(--primary))/90`,
                  defaultButtonBorder: `hsl(var(--primary))`,
                  defaultButtonText: `hsl(var(--primary-foreground))`,
                  dividerBackground: `hsl(var(--muted-foreground))`,
                  messageText: `hsl(var(--foreground))`,
                  messageBackground: `hsl(var(--muted))`,
                  anchorText: `hsl(var(--primary))`,
                },
              },
            },
          }}
          providers={[]} // Sem provedores de terceiros por enquanto
          redirectTo={window.location.origin + '/'} // Redireciona para a raiz após o login
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'Seu email',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'Seu email',
                password_input_placeholder: 'Sua senha',
                button_label: 'Cadastrar',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: 'Não tem uma conta? Cadastrar',
              },
              forgotten_password: {
                email_label: 'Email',
                email_input_placeholder: 'Seu email',
                button_label: 'Enviar instruções de recuperação',
                link_text: 'Esqueceu sua senha?',
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar senha',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;