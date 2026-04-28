import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react"; // Importando o ícone Users

interface PlanTypeChartProps {
  data: any[];
}

const COLORS = ['#FF5A00', '#00bcd4', '#ffc107', '#dc3545', '#6c757d', '#C0C0C0', '#008c9e', '#e0a800', '#bd2130', '#1e7e34']; // Usando as novas cores (Laranja Primário no topo)

// Função de categorização para agrupar nomes de planos longos
const categorizePlan = (planName: string): string => {
  const name = planName.trim().toLowerCase();

  if (name === 'sem contrato' || name === 'de dias') {
    return 'Outros / Sem Contrato';
  }
  if (name.includes('wellhub') || name.includes('totalpass') || name.includes('gympass') || name.includes('gurupass')) {
    return 'Planos Parceiros (Wellhub/Totalpass/Gurupass)';
  }
  if (name.includes('influenciador') || name.includes('vip') || name.includes('parceiro')) {
    return 'Planos VIP / Influencer';
  }
  
  // Agrupamento de planos recorrentes/mensais, incluindo pré-venda e bots
  if (
    name.includes('prime') || 
    name.includes('uno') || 
    name.includes('pró') || 
    name.includes('família') ||
    name.includes('mensal') ||
    name.includes('recorrente') ||
    name.includes('lote') ||
    name.includes('bot') ||
    name.includes('local') ||
    name.includes('promoção') ||
    name.includes('black friday')
  ) {
    // Tenta extrair o tipo principal do plano
    if (name.includes('prime')) return 'Plano Prime';
    if (name.includes('uno') || name.includes('um')) return 'Plano Uno / Um';
    if (name.includes('pró')) return 'Plano Pró';
    if (name.includes('família')) return 'Plano Família';
    
    return 'Planos Recorrentes Padrão';
  }

  return 'Outros Planos';
};

export function PlanTypeChart({ data }: PlanTypeChartProps) {
  const planTypeData = data.reduce((acc, member) => {
    const rawPlanName = member.NomeContrato || 'Sem Contrato';
    const category = categorizePlan(rawPlanName);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(planTypeData).map(([name, value]) => ({
    name,
    value
  }));

  // Ordenar para que as categorias mais importantes fiquem no topo da lista/gráfico
  chartData.sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-96 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <p className="text-[hsl(var(--muted-foreground))]">Nenhum dado disponível para tipos de plano.</p>
      </Card>
    );
  }

  return (
    <Card className="glow-card">
      <CardHeader className="flex flex-row items-center justify-between"> {/* Adicionado flexbox para alinhar título e ícone */}
        <CardTitle className="text-[hsl(var(--foreground))]">Alunos por Tipo de Plano (Categorizado)</CardTitle>
        <Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" /> {/* Ícone adicionado aqui */}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="hsl(var(--accent-turquoise))"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} alunos`, 'Quantidade']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card-bg))', 
                border: '1px solid hsl(var(--border-color))', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'hsl(var(--text-color))'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ color: 'hsl(var(--muted-foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}