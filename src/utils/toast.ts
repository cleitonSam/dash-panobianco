import { toast } from "sonner";

// Função auxiliar para adiar a execução de uma função
const deferToast = (fn: () => void) => {
  setTimeout(fn, 0);
};

export const showSuccess = (message: string) => {
  deferToast(() => {
    toast.success(message, {
      style: {
        backgroundColor: 'hsl(var(--success-color))',
        color: 'hsl(var(--accent-white))',
        border: '1px solid hsl(var(--success-color))',
      },
    });
  });
};

export const showError = (message: string) => {
  deferToast(() => {
    toast.error(message, {
      style: {
        backgroundColor: 'hsl(var(--danger-color))',
        color: 'hsl(var(--accent-white))',
        border: '1px solid hsl(var(--danger-color))',
      },
    });
  });
};

export const showLoading = (message: string) => {
  // Loading toasts geralmente precisam retornar um ID imediatamente, então não o adiamos.
  // Se este causar um aviso, podemos reavaliar.
  return toast.loading(message, {
    style: {
      backgroundColor: 'hsl(var(--card-bg))',
      color: 'hsl(var(--text-color))',
      border: '1px solid hsl(var(--border-color))',
    },
  });
};

export const dismissToast = (toastId: string) => {
  deferToast(() => {
    toast.dismiss(toastId);
  });
};