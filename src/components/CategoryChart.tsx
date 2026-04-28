import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Select, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoAnimationSelectContent } from '@/components/NoAnimationSelectContent'; // Importar o novo componente
import { cn } from '@/lib/utils'; // Importar cn para combinar classes

interface CategoryChartProps {
  data: any[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const categoricalColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Find columns that contain string values, which are good for categorization
    return Object.keys(data[0]).filter(key => typeof data[0][key] === 'string' || typeof data[0][key] === 'number');
  }, [data]);

  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(
    categoricalColumns.find(c => c.toLowerCase() === 'statuscontrato') || categoricalColumns[0]
  );

  const chartData = useMemo(() => {
    if (!selectedColumn || !data) return [];
    
    const counts = data.reduce((acc, item) => {
      const key = item[selectedColumn] || 'N/A';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10 results for clarity
  }, [data, selectedColumn]);

  if (categoricalColumns.length === 0) {
    return (
        <Card className="flex items-center justify-center h-96 bg-[hsl(var(--card-bg))] border-[hsl(var(--border-color))]"> {/* Wrapped in Card */}
            <p className="text-[hsl(var(--muted-foreground))]">No data available for charting.</p>
        </Card>
    );
  }

  return (
    <Card className="glow-card"> {/* Wrapped the entire content in a Card */}
      <CardHeader>
        <CardTitle className="text-[hsl(var(--foreground))]">Member Analysis</CardTitle> {/* Moved title to CardTitle */}
      </CardHeader>
      <CardContent>
        <div className="w-full md:w-[250px] mb-4">
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger className={cn(
              "w-full bg-[hsl(var(--background))] border border-[hsl(var(--input))] shadow-md",
              "hover:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--background))]"
            )}>
              <SelectValue placeholder="Select a column to analyze" />
            </SelectTrigger>
            <NoAnimationSelectContent className="bg-[hsl(var(--card-bg))] border border-[hsl(var(--border-color))] shadow-lg"> {/* Usando o novo componente */}
              {categoricalColumns.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </NoAnimationSelectContent>
          </Select>
        </div>
        <div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30 stroke-[hsl(var(--border-color))]" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card-bg))', 
                  border: '1px solid hsl(var(--border-color))', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: 'hsl(var(--text-color))'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--accent-turquoise))" name={`Count of ${selectedColumn}`} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}