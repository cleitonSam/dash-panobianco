import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface MembersPerContractChartProps {
  data: any[];
}

export function MembersPerContractChart({ data }: MembersPerContractChartProps) {
  const membersByContract = data.reduce((acc, member) => {
    const contractName = member.NomeContrato || 'Sem Contrato';
    acc[contractName] = (acc[contractName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(membersByContract)
    .map(([name, members]) => ({ name, members }))
    .sort((a, b) => b.members - a.members)
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <Card className="flex items-center justify-center h-96 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]">
        <p className="text-[hsl(var(--muted-foreground))]">Nenhum dado disponível para alunos por contrato.</p>
      </Card>
    );
  }

  return (
    <Card className="glow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-[hsl(var(--foreground))]">Alunos por Tipo de Contrato (Top 10)</CardTitle>
        <Users className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30 stroke-[hsl(var(--border-color))]" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              formatter={(value: number) => [`${value} alunos`, 'Quantidade']}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card-bg))', // Alterado para cor do card
                border: '1px solid hsl(var(--border-color))', // Alterado para cor da borda
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                color: 'hsl(var(--text-color))' // Adicionado para garantir cor do texto
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }} // Cor do texto do label
            />
            {/* <Legend /> -- REMOVIDO */}
            <Bar 
              dataKey="members" 
              fill="hsl(var(--accent-turquoise))" 
              name="Quantidade de Alunos"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}