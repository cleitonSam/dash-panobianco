import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Award, ShieldCheck } from "lucide-react";
import { MetricCard } from "./MetricCard"; // Importar MetricCard

interface MemberSummaryCardsProps {
  data: any[];
}

export function MemberSummaryCards({ data }: MemberSummaryCardsProps) {
  const totalWellhubTotalPass = data.filter(member => {
    const planName = member.NomeContrato?.toLowerCase() || '';
    return planName.includes('wellhub') || planName.includes('totalpass') || planName.includes('gurupass');
  }).length;

  const totalExcludingSpecificPlans = data.filter(member => {
    const planName = member.NomeContrato?.toLowerCase() || '';
    return !(
      planName.includes('influenciador') ||
      planName.includes('personal') ||
      planName.includes('combo 3 diárias') ||
      planName.includes('wellhub') || // Adicionado para excluir Wellhub
      planName.includes('totalpass') || // Adicionado para excluir TotalPass
      planName.includes('gurupass') || // Adicionado para excluir Gurupass
      planName.includes('vip') || // Simplificado para pegar todos os VIPs
      planName.includes('gympass')
    );
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard
        title="Wellhub + TotalPass + Gurupass"
        value={totalWellhubTotalPass}
        icon={<Award className="h-4 w-4 text-[hsl(var(--accent-silver))]" />}
        subtitle="Alunos com planos parceiros"
        valueClassName="text-[hsl(var(--accent-silver))]"
        hasLeftBorderGradient
      />

      <MetricCard
        title="Planos Padrão"
        value={totalExcludingSpecificPlans}
        icon={<ShieldCheck className="h-4 w-4 text-[hsl(var(--accent-turquoise))]" />}
        subtitle="Excluindo Influencer, Personal, Combo 3 Diárias, Parceiros e VIPs"
        valueClassName="text-[hsl(var(--accent-turquoise))]"
        hasLeftBorderGradient
      />
    </div>
  );
}