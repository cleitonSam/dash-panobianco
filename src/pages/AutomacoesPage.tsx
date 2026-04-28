"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Send,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Zap,
  Info,
  FlaskConical,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  Shuffle,
  Phone,
  Users,
  Sparkles,
  Rocket,
  Target,
  AlertTriangle,
  Copy,
  Download,
  ImageIcon,
  Settings2,
  Timer,
  UserCheck,
  UserX,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useAutomations,
  AUTOMATION_CATEGORIES,
  AutomationCategory,
  MessageTemplate,
  parsePhoneList,
  pickRandomMessage,
  formatPhoneBR,
} from "@/hooks/useAutomations";

// ─── CategoryCard (por automação EVO) ────────────────────────────────────────

interface CategoryCardProps {
  categoryKey: AutomationCategory;
  label: string;
  description: string;
  icon: string;
  defaultTemplate: string;
  savedTemplate: MessageTemplate | undefined;
  isDispatching: boolean;
  onSave: (
    category: AutomationCategory,
    text: string,
    variations: string[]
  ) => void;
  onDispatch: (category: AutomationCategory) => void;
  onToggle: (category: AutomationCategory, enabled: boolean) => void;
  onTest: (message: string, variations: string[]) => void;
  isSaving: boolean;
  isTogglingCategory: AutomationCategory | null;
  isTesting: boolean;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  categoryKey,
  label,
  description,
  icon,
  defaultTemplate,
  savedTemplate,
  isDispatching,
  onSave,
  onDispatch,
  onToggle,
  onTest,
  isSaving,
  isTogglingCategory,
  isTesting,
}) => {
  const [text, setText] = useState(
    savedTemplate?.message_template ?? defaultTemplate
  );
  const [variations, setVariations] = useState<string[]>(
    savedTemplate?.message_variations ?? []
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [showVariations, setShowVariations] = useState(
    (savedTemplate?.message_variations?.length ?? 0) > 0
  );

  useEffect(() => {
    if (savedTemplate?.message_template) {
      setText(savedTemplate.message_template);
      setHasChanges(false);
    }
    if (savedTemplate?.message_variations) {
      setVariations(savedTemplate.message_variations);
      if (savedTemplate.message_variations.length > 0) setShowVariations(true);
    }
  }, [savedTemplate?.message_template, savedTemplate?.message_variations]);

  const handleTextChange = (v: string) => {
    setText(v);
    setHasChanges(true);
  };

  const addVariation = () => {
    setVariations([...variations, ""]);
    setHasChanges(true);
  };

  const updateVariation = (idx: number, value: string) => {
    const updated = [...variations];
    updated[idx] = value;
    setVariations(updated);
    setHasChanges(true);
  };

  const removeVariation = (idx: number) => {
    setVariations(variations.filter((_, i) => i !== idx));
    setHasChanges(true);
  };

  const enabled = savedTemplate?.enabled ?? true;
  const isToggling = isTogglingCategory === categoryKey;
  const totalVariations = 1 + variations.filter((v) => v.trim()).length;

  // Preview com variação aleatória
  const [previewIdx, setPreviewIdx] = useState(0);
  const allMessages = [text, ...variations.filter((v) => v.trim())];
  const previewMsg = allMessages[previewIdx % allMessages.length] || text;

  return (
    <Card className="glow-card border-[hsl(var(--border-color))] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--primary))]/5 flex items-center justify-center text-xl">
              {icon}
            </div>
            <div>
              <CardTitle className="text-[hsl(var(--foreground))] text-base">
                {label}
              </CardTitle>
              <CardDescription className="text-[hsl(var(--muted-foreground))] text-xs mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalVariations > 1 && (
              <Badge
                variant="outline"
                className="border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))] text-[10px] gap-1"
              >
                <Shuffle className="h-3 w-3" />
                {totalVariations} msgs
              </Badge>
            )}
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" />
            ) : (
              <Switch
                checked={enabled}
                onCheckedChange={(v) => onToggle(categoryKey, v)}
                disabled={!savedTemplate}
              />
            )}
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={
                enabled
                  ? "bg-[hsl(var(--success-color))]/20 text-[hsl(var(--success-color))] border-[hsl(var(--success-color))]/40"
                  : "bg-[hsl(var(--muted))]/30 text-[hsl(var(--muted-foreground))]"
              }
            >
              {enabled ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Hint variáveis */}
        <Alert className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] py-2 px-3">
          <Info className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          <AlertDescription className="text-[hsl(var(--muted-foreground))] text-xs ml-1">
            Use{" "}
            <code className="font-mono bg-[hsl(var(--secondary-black))] px-1 rounded">
              {"{nome}"}
            </code>{" "}
            para inserir o nome do aluno. Adicione variações para disparo
            inteligente.
          </AlertDescription>
        </Alert>

        {/* Mensagem principal */}
        <div className="relative">
          <label className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold mb-1 block">
            Mensagem Principal
          </label>
          <Textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={3}
            placeholder="Digite a mensagem que será enviada..."
            className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm"
          />
        </div>

        {/* Toggle variações */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowVariations(!showVariations);
            if (!showVariations && variations.length === 0) addVariation();
          }}
          className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))]/10 text-xs gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {showVariations
            ? "Ocultar Variações"
            : "Adicionar Variações (Disparo Inteligente)"}
        </Button>

        {/* Variações de mensagem */}
        {showVariations && (
          <div className="space-y-2 pl-3 border-l-2 border-[hsl(var(--primary))]/30">
            <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
              Variações (selecionadas aleatoriamente no disparo)
            </p>
            {variations.map((v, idx) => (
              <div key={idx} className="flex gap-2">
                <Textarea
                  value={v}
                  onChange={(e) => updateVariation(idx, e.target.value)}
                  rows={2}
                  placeholder={`Variação ${idx + 1}...`}
                  className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariation(idx)}
                  className="text-[hsl(var(--danger-color))] hover:bg-[hsl(var(--danger-color))]/10 shrink-0 self-start mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariation}
              className="border-dashed border-[hsl(var(--border-color))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova Variação
            </Button>
          </div>
        )}

        {/* Preview */}
        {text && (
          <div className="rounded-lg bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))] p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                Prévia{" "}
                {totalVariations > 1 &&
                  `(variação ${(previewIdx % allMessages.length) + 1}/${totalVariations})`}
              </p>
              {totalVariations > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewIdx((p) => p + 1)}
                  className="h-5 px-2 text-[10px] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 gap-1"
                >
                  <Shuffle className="h-3 w-3" />
                  Outra
                </Button>
              )}
            </div>
            <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
              {previewMsg
                .replace(/\{nome\}/gi, "João")
                .replace(/\{name\}/gi, "João")}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSave(categoryKey, text, variations)}
            disabled={(!hasChanges && !!savedTemplate) || isSaving}
            className="bg-[hsl(var(--secondary-black))] border-[hsl(var(--border-color))] text-[hsl(var(--accent-white))] hover:bg-[hsl(var(--card-bg))]"
          >
            {isSaving ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-3.5 w-3.5" />
            )}
            {!savedTemplate
              ? "Salvar Template"
              : hasChanges
              ? "Salvar Template"
              : "Salvo"}
          </Button>

          <Button
            size="sm"
            onClick={() => onDispatch(categoryKey)}
            disabled={isDispatching || !savedTemplate}
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            {isDispatching ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Rocket className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isDispatching ? "Disparando..." : "Disparar Agora"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onTest(text, variations)}
            disabled={isTesting || !text.trim()}
            className="border-[hsl(var(--warning-color))]/40 text-[hsl(var(--warning-color))] hover:bg-[hsl(var(--warning-color))]/10"
          >
            {isTesting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
            )}
            Testar
          </Button>

          {!savedTemplate && (
            <span className="text-xs text-yellow-500 font-medium">
              Salve o template para ativar o disparo automático.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

const AutomacoesPage: React.FC = () => {
  const { members = [] } = useOutletContext<{ members: any[] }>();
  const {
    fetchTemplates,
    saveTemplate,
    toggleAutomation,
    dispatch,
    testDispatch,
    customDispatch,
    fetchLogs,
  } = useAutomations();

  const { data: templates = [], isLoading: isLoadingTemplates } =
    fetchTemplates;
  const { data: logs = [], isLoading: isLoadingLogs } = fetchLogs;

  const [dispatchingCategory, setDispatchingCategory] =
    useState<AutomationCategory | null>(null);
  const [togglingCategory, setTogglingCategory] =
    useState<AutomationCategory | null>(null);

  // ── Test dispatch state
  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("Teste");
  const [testMessage, setTestMessage] = useState(
    "Olá {nome}! Esta é uma mensagem de teste do sistema de disparos Panobianco. Se recebeu, está tudo funcionando!"
  );
  const [testCategory, setTestCategory] = useState<AutomationCategory | "custom">("custom");
  const [testImageUrl, setTestImageUrl] = useState("");

  // ── Custom dispatch state
  const [customPhoneInput, setCustomPhoneInput] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customVariations, setCustomVariations] = useState<string[]>([]);
  const [showCustomVariations, setShowCustomVariations] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [parsedPhones, setParsedPhones] = useState<string[]>([]);
  const [isCustomDispatching, setIsCustomDispatching] = useState(false);
  const [customProgress, setCustomProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [customTestSent, setCustomTestSent] = useState(false);
  const [showDelayConfig, setShowDelayConfig] = useState(false);
  const [customDelayMs, setCustomDelayMs] = useState(2000);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Membros ativos e inativos do EVO ──
  const activeMembers = useMemo(() => {
    return members.filter((m: any) => {
      const status = (m.StatusContrato || "").toLowerCase();
      return status === "ativo";
    });
  }, [members]);

  const inactiveMembers = useMemo(() => {
    return members.filter((m: any) => {
      const status = (m.StatusContrato || "").toLowerCase();
      return ["inadimplente", "vencido", "cancelado", "inativo"].includes(status);
    });
  }, [members]);

  const loadMemberPhones = (memberList: any[]) => {
    const phones = memberList
      .map((m: any) => m.Celular)
      .filter((p: any) => p && String(p).replace(/\D/g, "").length >= 8)
      .map((p: any) => String(p).replace(/\D/g, ""));
    const uniquePhones = [...new Set(phones)];
    setCustomPhoneInput(uniquePhones.join("\n"));
    setCustomTestSent(false);
  };

  // Parse phones quando o input muda
  useEffect(() => {
    if (customPhoneInput.trim()) {
      setParsedPhones(parsePhoneList(customPhoneInput));
    } else {
      setParsedPhones([]);
    }
  }, [customPhoneInput]);

  const templatesByCategory = useMemo(() => {
    return templates.reduce<Record<string, MessageTemplate>>((acc, t) => {
      acc[t.category] = t;
      return acc;
    }, {});
  }, [templates]);

  const handleSave = (
    category: AutomationCategory,
    text: string,
    variations: string[]
  ) => {
    saveTemplate.mutate({
      category,
      message_template: text,
      enabled: templatesByCategory[category]?.enabled ?? true,
      message_variations: variations.filter((v) => v.trim()),
    });
  };

  const handleDispatch = async (category: AutomationCategory) => {
    setDispatchingCategory(category);
    try {
      await dispatch.mutateAsync({ category });
    } finally {
      setDispatchingCategory(null);
    }
  };

  const handleToggle = async (
    category: AutomationCategory,
    enabled: boolean
  ) => {
    setTogglingCategory(category);
    try {
      await toggleAutomation.mutateAsync({ category, enabled });
    } finally {
      setTogglingCategory(null);
    }
  };

  // Test dispatch handler
  const handleTestDispatch = async (
    messageOverride?: string,
    variationsOverride?: string[],
    imageOverride?: string
  ) => {
    if (!testPhone.trim()) return;

    const msg = messageOverride || testMessage;
    const vars = variationsOverride || [];
    const chosen = pickRandomMessage(msg, vars);
    const img = imageOverride ?? testImageUrl;

    await testDispatch.mutateAsync({
      phone: testPhone,
      message: chosen,
      name: testName || "Teste",
      imageUrl: img || undefined,
    });
  };

  // CSV file import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCustomPhoneInput((prev) => (prev ? prev + "\n" : "") + text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Export phone list as CSV
  const handleExportCSV = () => {
    if (parsedPhones.length === 0) return;
    const csv = parsedPhones.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `numeros-disparo-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom test dispatch (send to test phone before mass dispatch)
  const handleCustomTestDispatch = async () => {
    if (!testPhone.trim() || !customMessage.trim()) return;
    const chosen = pickRandomMessage(customMessage, customVariations.filter((v) => v.trim()));
    await testDispatch.mutateAsync({
      phone: testPhone,
      message: chosen,
      name: testName || "Teste",
      imageUrl: customImageUrl || undefined,
    });
    setCustomTestSent(true);
  };

  // Custom dispatch
  const handleCustomDispatch = async () => {
    if (parsedPhones.length === 0 || !customMessage.trim()) return;
    setIsCustomDispatching(true);
    setCustomProgress({ sent: 0, failed: 0, total: parsedPhones.length });
    try {
      await customDispatch.mutateAsync({
        phones: parsedPhones,
        message: customMessage,
        variations: customVariations.filter((v) => v.trim()),
        imageUrl: customImageUrl || undefined,
        delayMs: customDelayMs,
      });
    } finally {
      setIsCustomDispatching(false);
      setCustomTestSent(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/60 flex items-center justify-center">
          <Zap className="h-6 w-6 text-[hsl(var(--primary-foreground))]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
            Central de Disparos WhatsApp
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Disparos inteligentes com variedade de mensagens, teste e
            personalização completa.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="categorias" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))] h-auto p-1">
          <TabsTrigger
            value="categorias"
            className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] text-[hsl(var(--muted-foreground))] py-2.5 text-xs sm:text-sm gap-1.5"
          >
            <Target className="h-4 w-4 hidden sm:block" />
            Categorias EVO
          </TabsTrigger>
          <TabsTrigger
            value="custom"
            className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] text-[hsl(var(--muted-foreground))] py-2.5 text-xs sm:text-sm gap-1.5"
          >
            <Users className="h-4 w-4 hidden sm:block" />
            Disparo Custom
          </TabsTrigger>
          <TabsTrigger
            value="teste"
            className="data-[state=active]:bg-[hsl(var(--warning-color))] data-[state=active]:text-[hsl(var(--primary-black))] text-[hsl(var(--muted-foreground))] py-2.5 text-xs sm:text-sm gap-1.5"
          >
            <FlaskConical className="h-4 w-4 hidden sm:block" />
            Teste
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] text-[hsl(var(--muted-foreground))] py-2.5 text-xs sm:text-sm gap-1.5"
          >
            <History className="h-4 w-4 hidden sm:block" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* ────────────── TAB: CATEGORIAS EVO ────────────── */}
        <TabsContent value="categorias" className="mt-4">
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {AUTOMATION_CATEGORIES.map((cat) => (
                <CategoryCard
                  key={cat.key}
                  categoryKey={cat.key}
                  label={cat.label}
                  description={cat.description}
                  icon={cat.icon}
                  defaultTemplate={cat.defaultTemplate}
                  savedTemplate={templatesByCategory[cat.key]}
                  isDispatching={dispatchingCategory === cat.key}
                  onSave={handleSave}
                  onDispatch={handleDispatch}
                  onToggle={handleToggle}
                  onTest={(msg, vars) => {
                    if (!testPhone.trim()) {
                      setTestMessage(msg);
                      // Switch to test tab
                      const testTab = document.querySelector(
                        '[data-state][value="teste"]'
                      ) as HTMLElement;
                      testTab?.click();
                      return;
                    }
                    handleTestDispatch(msg, vars);
                  }}
                  isSaving={saveTemplate.isPending}
                  isTogglingCategory={togglingCategory}
                  isTesting={testDispatch.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ────────────── TAB: DISPARO CUSTOM ────────────── */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          {/* Import Numbers Card */}
          <Card className="glow-card border-[hsl(var(--border-color))]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-[hsl(var(--foreground))] text-base">
                    Lista de Números
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--muted-foreground))] text-xs">
                    Cole números, importe CSV ou adicione manualmente.
                    Separados por vírgula, ponto-e-vírgula ou um por linha.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={customPhoneInput}
                onChange={(e) => setCustomPhoneInput(e.target.value)}
                rows={5}
                placeholder={"11999887766\n21988776655\n31977665544\n\nOu cole uma lista inteira aqui..."}
                className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm font-mono"
              />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-[hsl(var(--border-color))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card-bg))] text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Importar CSV
                  </Button>

                  {parsedPhones.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportCSV}
                      className="border-[hsl(var(--border-color))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card-bg))] text-xs gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Exportar CSV
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {parsedPhones.length > 0 && (
                    <Badge className="bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/40">
                      <Users className="h-3 w-3 mr-1" />
                      {parsedPhones.length} números válidos
                    </Badge>
                  )}
                  {customPhoneInput.trim() && parsedPhones.length === 0 && (
                    <Badge className="bg-[hsl(var(--danger-color))]/20 text-[hsl(var(--danger-color))] border-[hsl(var(--danger-color))]/40">
                      Nenhum número válido
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Card */}
          <Card className="glow-card border-[hsl(var(--border-color))]">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-[hsl(var(--foreground))] text-base">
                    Mensagem do Disparo
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--muted-foreground))] text-xs">
                    Escreva a mensagem e adicione variações para disparo
                    inteligente.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                placeholder="Digite a mensagem para enviar..."
                className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm"
              />

              {/* Variações */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomVariations(!showCustomVariations);
                  if (
                    !showCustomVariations &&
                    customVariations.length === 0
                  )
                    setCustomVariations([""]);
                }}
                className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))]/10 text-xs gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showCustomVariations
                  ? "Ocultar Variações"
                  : "Adicionar Variações (Disparo Inteligente)"}
              </Button>

              {showCustomVariations && (
                <div className="space-y-2 pl-3 border-l-2 border-[hsl(var(--primary))]/30">
                  <p className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] font-semibold">
                    Variações (selecionadas aleatoriamente)
                  </p>
                  {customVariations.map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Textarea
                        value={v}
                        onChange={(e) => {
                          const u = [...customVariations];
                          u[idx] = e.target.value;
                          setCustomVariations(u);
                        }}
                        rows={2}
                        placeholder={`Variação ${idx + 1}...`}
                        className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setCustomVariations(
                            customVariations.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-[hsl(var(--danger-color))] hover:bg-[hsl(var(--danger-color))]/10 shrink-0 self-start mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomVariations([...customVariations, ""])}
                    className="border-dashed border-[hsl(var(--border-color))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova Variação
                  </Button>
                </div>
              )}

              {/* Anexar Imagem */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  Anexar Imagem (opcional)
                </label>
                <Input
                  value={customImageUrl}
                  onChange={(e) => { setCustomImageUrl(e.target.value); setCustomTestSent(false); }}
                  placeholder="Cole a URL da imagem (ex: https://i.imgur.com/foto.jpg)"
                  className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] text-sm"
                />
                {customImageUrl.trim() && (
                  <div className="mt-2 rounded-lg border border-[hsl(var(--border-color))] overflow-hidden max-w-[200px]">
                    <img src={customImageUrl} alt="Preview" className="w-full h-auto max-h-32 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                  A mensagem será enviada como legenda da imagem. Deixe vazio para enviar só texto.
                </p>
              </div>

              {/* Configuração de Delay */}
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDelayConfig(!showDelayConfig)}
                  className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--card-bg))] text-xs gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configurar Delay Inteligente
                </Button>

                {showDelayConfig && (
                  <div className="mt-2 p-3 rounded-lg bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))] space-y-3">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-[hsl(var(--primary))]" />
                      <p className="text-xs font-medium text-[hsl(var(--foreground))]">
                        Delay Base entre Mensagens
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Rápido", value: 1500, desc: "1.5s + jitter" },
                        { label: "Recomendado", value: 2000, desc: "2s + jitter" },
                        { label: "Seguro", value: 3500, desc: "3.5s + jitter" },
                      ].map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          size="sm"
                          variant={customDelayMs === opt.value ? "default" : "outline"}
                          onClick={() => setCustomDelayMs(opt.value)}
                          className={
                            customDelayMs === opt.value
                              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex-col h-auto py-2"
                              : "border-[hsl(var(--border-color))] text-[hsl(var(--foreground))] flex-col h-auto py-2"
                          }
                        >
                          <span className="text-xs font-semibold">{opt.label}</span>
                          <span className="text-[10px] opacity-70">{opt.desc}</span>
                        </Button>
                      ))}
                    </div>
                    <Alert className="bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))] py-2 px-3">
                      <Info className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                      <AlertDescription className="text-[hsl(var(--muted-foreground))] text-[10px] ml-1">
                        O delay aumenta progressivamente: a cada 10 msgs adiciona +3s, e a cada 30 msgs faz uma pausa longa (8-15s).
                        Isso simula comportamento humano e evita bloqueio do WhatsApp.
                        <br />
                        <strong>Sugestão:</strong> Para até 50 números use "Rápido". Para 50-200 use "Recomendado". Para +200 use "Seguro".
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              {/* Preview */}
              {customMessage && (
                <div className="rounded-lg bg-[hsl(var(--secondary-black))] border border-[hsl(var(--border-color))] p-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1">
                    Prévia
                  </p>
                  {customImageUrl.trim() && (
                    <div className="mb-2 rounded-lg overflow-hidden max-w-[180px]">
                      <img src={customImageUrl} alt="Imagem" className="w-full h-auto max-h-28 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                    {customMessage.replace(/\{nome\}/gi, "").replace(/\{name\}/gi, "")}
                  </p>
                </div>
              )}

              {/* Warning */}
              {parsedPhones.length > 50 && (
                <Alert className="bg-[hsl(var(--warning-color))]/10 border-[hsl(var(--warning-color))]/40">
                  <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning-color))]" />
                  <AlertDescription className="text-[hsl(var(--warning-color))] text-xs">
                    Disparo com {parsedPhones.length} números. Delay inteligente ativado ({customDelayMs/1000}s base + progressivo).
                    Tempo estimado: ~{Math.ceil((parsedPhones.length * (customDelayMs / 1000 + 2)) / 60)} min.
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions: Test + Dispatch */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {/* Botão de teste antes do disparo */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCustomTestDispatch}
                  disabled={
                    testDispatch.isPending ||
                    !testPhone.trim() ||
                    !customMessage.trim()
                  }
                  className={
                    customTestSent
                      ? "border-[hsl(var(--success-color))]/40 text-[hsl(var(--success-color))] hover:bg-[hsl(var(--success-color))]/10"
                      : "border-[hsl(var(--warning-color))]/40 text-[hsl(var(--warning-color))] hover:bg-[hsl(var(--warning-color))]/10"
                  }
                >
                  {testDispatch.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : customTestSent ? (
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {customTestSent ? "Teste Enviado!" : "Enviar Teste Antes"}
                </Button>

                <Button
                  onClick={handleCustomDispatch}
                  disabled={
                    isCustomDispatching ||
                    parsedPhones.length === 0 ||
                    !customMessage.trim()
                  }
                  className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))] hover:opacity-90"
                >
                  {isCustomDispatching ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  {isCustomDispatching
                    ? "Disparando..."
                    : `Disparar para ${parsedPhones.length} números`}
                </Button>

                {!testPhone.trim() && (
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    Configure seu número na aba Teste para usar o "Enviar Teste Antes"
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────── TAB: TESTE ────────────── */}
        <TabsContent value="teste" className="mt-4 space-y-4">
          <Alert className="bg-[hsl(var(--warning-color))]/10 border-[hsl(var(--warning-color))]/40">
            <FlaskConical className="h-4 w-4 text-[hsl(var(--warning-color))]" />
            <AlertDescription className="text-[hsl(var(--warning-color))] text-sm font-medium">
              Area de Teste - Envie uma mensagem para o SEU número antes de
              disparar em massa. Garanta que está tudo correto!
            </AlertDescription>
          </Alert>

          <Card className="glow-card border-[hsl(var(--warning-color))]/30 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--warning-color))]/30 to-[hsl(var(--warning-color))]/10 flex items-center justify-center">
                  <FlaskConical className="h-6 w-6 text-[hsl(var(--warning-color))]" />
                </div>
                <div>
                  <CardTitle className="text-[hsl(var(--foreground))] text-lg">
                    Disparo de Teste
                  </CardTitle>
                  <CardDescription className="text-[hsl(var(--muted-foreground))] text-sm">
                    Teste sua mensagem enviando para um número específico.
                    Verifique se a personalização e o conteúdo estão corretos
                    antes do disparo real.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Número de teste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 block">
                    Número do Teste (seu número)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="11999887766"
                      className="pl-9 bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 block">
                    Nome para Substituição
                  </label>
                  <Input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="Ex: João"
                    className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))]"
                  />
                </div>
              </div>

              {/* Selecionar template ou custom */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 block">
                  Origem da mensagem
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={testCategory === "custom" ? "default" : "outline"}
                    onClick={() => setTestCategory("custom")}
                    className={
                      testCategory === "custom"
                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                        : "border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]"
                    }
                  >
                    Mensagem Livre
                  </Button>
                  {AUTOMATION_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.key}
                      type="button"
                      size="sm"
                      variant={testCategory === cat.key ? "default" : "outline"}
                      onClick={() => {
                        setTestCategory(cat.key);
                        const tmpl = templatesByCategory[cat.key];
                        if (tmpl) {
                          setTestMessage(tmpl.message_template);
                        } else {
                          setTestMessage(cat.defaultTemplate);
                        }
                      }}
                      className={
                        testCategory === cat.key
                          ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                          : "border-[hsl(var(--border-color))] text-[hsl(var(--foreground))]"
                      }
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 block">
                  Mensagem de Teste
                </label>
                <Textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={4}
                  placeholder="Digite a mensagem de teste..."
                  className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] resize-none text-sm"
                />
              </div>

              {/* Anexar Imagem */}
              <div>
                <label className="text-xs font-medium text-[hsl(var(--foreground))] mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  Anexar Imagem (opcional)
                </label>
                <Input
                  value={testImageUrl}
                  onChange={(e) => setTestImageUrl(e.target.value)}
                  placeholder="Cole a URL da imagem (ex: https://i.imgur.com/foto.jpg)"
                  className="bg-[hsl(var(--background))] border-[hsl(var(--input))] text-[hsl(var(--foreground))] text-sm"
                />
                {testImageUrl.trim() && (
                  <div className="mt-2 rounded-lg border border-[hsl(var(--border-color))] overflow-hidden max-w-[200px]">
                    <img src={testImageUrl} alt="Preview" className="w-full h-auto max-h-32 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                  A mensagem será enviada como legenda da imagem. Deixe vazio para enviar só texto.
                </p>
              </div>

              {/* Preview */}
              {testMessage && testName && (
                <div className="rounded-lg bg-[hsl(var(--secondary-black))] border border-[hsl(var(--warning-color))]/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[hsl(var(--warning-color))]/20 flex items-center justify-center">
                      <FlaskConical className="h-3 w-3 text-[hsl(var(--warning-color))]" />
                    </div>
                    <p className="text-[10px] text-[hsl(var(--warning-color))] uppercase tracking-wider font-semibold">
                      Prévia da Mensagem de Teste
                    </p>
                  </div>
                  {testImageUrl.trim() && (
                    <div className="mb-2 rounded-lg overflow-hidden max-w-[180px]">
                      <img src={testImageUrl} alt="Imagem anexada" className="w-full h-auto max-h-28 object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap">
                    {testMessage
                      .replace(/\{nome\}/gi, testName)
                      .replace(/\{name\}/gi, testName)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-[hsl(var(--border-color))] flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                    <Phone className="h-3 w-3" />
                    Será enviado para: {testPhone || "---"}
                    {testImageUrl.trim() && (
                      <span className="ml-2 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Com imagem
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Enviar teste */}
              <Button
                onClick={() => handleTestDispatch()}
                disabled={
                  testDispatch.isPending ||
                  !testPhone.trim() ||
                  !testMessage.trim()
                }
                size="lg"
                className="w-full bg-gradient-to-r from-[hsl(var(--warning-color))] to-orange-500 text-[hsl(var(--primary-black))] font-bold hover:opacity-90"
              >
                {testDispatch.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                {testDispatch.isPending
                  ? "Enviando Teste..."
                  : "Enviar Mensagem de Teste"}
              </Button>

              {!testPhone.trim() && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                  Insira seu número acima para ativar o envio de teste.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────── TAB: HISTÓRICO ────────────── */}
        <TabsContent value="historico" className="mt-4">
          <Card className="glow-card border-[hsl(var(--border-color))]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-[hsl(var(--primary))]" />
                <CardTitle className="text-[hsl(var(--foreground))]">
                  Histórico de Disparos
                </CardTitle>
              </div>
              <CardDescription className="text-[hsl(var(--muted-foreground))]">
                Últimos 50 disparos realizados com detalhes de envio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Clock className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
                  <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
                    Nenhum disparo realizado ainda.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {logs.map((log) => {
                    const catMeta = AUTOMATION_CATEGORIES.find(
                      (c) => c.key === log.category
                    );
                    const isCustom = log.category === "custom";
                    const isTest = log.triggered_by === "test";
                    const allSent =
                      log.failed_count === 0 && log.sent_count > 0;
                    const hasFailed = log.failed_count > 0;

                    return (
                      <AccordionItem
                        key={log.id}
                        value={log.id}
                        className="border-[hsl(var(--border-color))]"
                      >
                        <AccordionTrigger className="hover:no-underline py-3 px-1">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-lg">
                              {isTest
                                ? "🧪"
                                : isCustom
                                ? "📋"
                                : catMeta?.icon ?? "📨"}
                            </span>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                                {isTest
                                  ? "Teste"
                                  : isCustom
                                  ? "Disparo Personalizado"
                                  : catMeta?.label ?? log.category}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {format(
                                  new Date(log.started_at),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR }
                                )}{" "}
                                ·{" "}
                                {log.triggered_by === "auto"
                                  ? "Automático"
                                  : log.triggered_by === "test"
                                  ? "Teste"
                                  : "Manual"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {allSent && (
                                <Badge className="bg-[hsl(var(--success-color))]/20 text-[hsl(var(--success-color))] border-[hsl(var(--success-color))]/40 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {log.sent_count} enviados
                                </Badge>
                              )}
                              {hasFailed && (
                                <>
                                  {log.sent_count > 0 && (
                                    <Badge className="bg-[hsl(var(--success-color))]/20 text-[hsl(var(--success-color))] border-[hsl(var(--success-color))]/40 text-xs">
                                      {log.sent_count} ok
                                    </Badge>
                                  )}
                                  <Badge className="bg-[hsl(var(--danger-color))]/20 text-[hsl(var(--danger-color))] border-[hsl(var(--danger-color))]/40 text-xs">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {log.failed_count} falhas
                                  </Badge>
                                </>
                              )}
                              {log.total_members === 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  0 alunos
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {log.details && log.details.length > 0 ? (
                            <div className="rounded-md border border-[hsl(var(--border-color))] overflow-hidden mt-2">
                              <Table>
                                <TableHeader className="bg-[hsl(var(--secondary-black))]">
                                  <TableRow>
                                    <TableHead className="text-[hsl(var(--accent-silver))] text-xs">
                                      Nome
                                    </TableHead>
                                    <TableHead className="text-[hsl(var(--accent-silver))] text-xs">
                                      Telefone
                                    </TableHead>
                                    <TableHead className="text-[hsl(var(--accent-silver))] text-xs">
                                      Status
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {log.details.map((d, i) => (
                                    <TableRow
                                      key={i}
                                      className="border-b border-[hsl(var(--border-color))]"
                                    >
                                      <TableCell className="text-xs text-[hsl(var(--foreground))]">
                                        {d.name}
                                      </TableCell>
                                      <TableCell className="text-xs text-[hsl(var(--muted-foreground))]">
                                        {d.phone}
                                      </TableCell>
                                      <TableCell>
                                        {d.status === "sent" ? (
                                          <span className="flex items-center gap-1 text-xs text-[hsl(var(--success-color))]">
                                            <CheckCircle className="h-3 w-3" />
                                            Enviado
                                          </span>
                                        ) : (
                                          <span
                                            className="flex items-center gap-1 text-xs text-[hsl(var(--danger-color))]"
                                            title={d.error}
                                          >
                                            <XCircle className="h-3 w-3" />{" "}
                                            Falha
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] py-2 px-1">
                              Nenhum detalhe disponível.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomacoesPage;
