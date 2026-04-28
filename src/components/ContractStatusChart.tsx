import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react"; // Importando o ícone ClipboardCheck

interface ContractStatusChartProps {
  data: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning-color))', 'hsl(var(--danger-color))', 'hsl(var(--pending-color))', 'hsl(var(--accent-silver))']; // Cores para Ativos (Laranja), Inadimplentes, Vencidos, Cancelados, Desconhecido

export function ContractStatusChart({ data }: ContractStatusChartProps) {
  const statusData = data.reduce((acc, member) => {
    const status = member.StatusContrato?.toLowerCase() || 'desconhecido';
    let category = 'Desconhecido';
    
    if (status.includes('ativo')) {
      category = 'Ativos';
    } else if (status.includes('inadimplente')) {
      category = 'Inadimplentes';
    } else if (status.includes('vencido')) {
      category = 'Vencidos';
    } else if (status.includes('cancelado')) {
      category = 'Cancelados';
    }
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(statusData).map(([name, value]) => ({
    name,
    value
  }));

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-96 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <p className="text-[hsl(var(--muted-foreground))]">Nenhum dado disponível para status de contrato.</p>
      </Card>
    );
  }

  return (
    <Card className="glow-card">
      <CardHeader className="flex flex-row items-center justify-between"> {/* Adicionado flexbox para alinhar título e ícone */}
        <CardTitle className="text-[hsl(var(--foreground))]">Status dos Contratos</CardTitle>
        <ClipboardCheck className="h-5 w-5 text-[hsl(var(--primary))]" /> {/* Ícone alterado para laranja primário */}
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