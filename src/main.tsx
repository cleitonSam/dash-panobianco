import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Log de depuração para verificar variáveis de ambiente no início
console.log("DEBUG: All VITE_ environment variables from main.tsx:", import.meta.env);

createRoot(document.getElementById("root")!).render(<App />);