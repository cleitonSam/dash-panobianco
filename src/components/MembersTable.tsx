import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MembersTableProps {
  data: any[];
}

export function MembersTable({ data }: MembersTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-center text-[hsl(var(--muted-foreground))] py-8">No member data available.</p>;
  }

  // Use the keys from the first object as headers, but limit to a reasonable number for display
  const headers = Object.keys(data[0]).slice(0, 8);

  return (
    <div className="rounded-md border border-[hsl(var(--border-color))] bg-[hsl(var(--card-bg))] text-[hsl(var(--text-color))]"> {/* Adicionado bg-card e text-card-foreground */}
      <Table>
        <TableHeader className="bg-[hsl(var(--secondary-black))]"> {/* Adicionado bg-muted para o cabeçalho */}
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="text-[hsl(var(--accent-silver))]">{header}</TableHead> {/* Garantido a cor do texto */}
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.slice(0, 20).map((row, rowIndex) => ( // Show first 20 rows for performance
            <TableRow key={rowIndex} className="border-b border-[hsl(var(--border-color))] hover:bg-[hsl(var(--secondary-black))]/50"> {/* Adicionado borda e hover */}
              {headers.map((header) => (
                <TableCell key={header} className="text-[hsl(var(--text-color))]">{String(row[header] ?? '')}</TableCell> {/* Garantido a cor do texto */}
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}