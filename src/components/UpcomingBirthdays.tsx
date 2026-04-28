import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Cake, AlertCircle } from 'lucide-react';
import { format, parse, isSameDay, isSameMonth, addMonths, startOfDay, getDayOfYear, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingBirthdaysProps {
  members: any[];
  isLoadingMembers: boolean;
  errorMembers: string | null;
}

interface BirthdayMember {
  name: string;
  birthDate: Date;
  originalDateString: string;
}

export const UpcomingBirthdays: React.FC<UpcomingBirthdaysProps> = ({
  members,
  isLoadingMembers,
  errorMembers,
}) => {
  const upcomingBirthdays = useMemo(() => {
    if (isLoadingMembers || !members || members.length === 0) return [];

    const today = startOfDay(new Date());
    const currentYear = getYear(today);
    const nextMonthDate = addMonths(today, 1);

    const birthdays: BirthdayMember[] = [];

    members.forEach(member => {
      const birthDateString = member.DataNascimento;
      const memberName = member.Nome;

      if (birthDateString && memberName) {
        try {
          // Parse the date string (e.g., "01/01/1990")
          const parsedDate = parse(birthDateString, 'dd/MM/yyyy', new Date());
          
          // Create a date for this year's birthday
          let thisYearBirthday = new Date(currentYear, parsedDate.getMonth(), parsedDate.getDate());
          thisYearBirthday = startOfDay(thisYearBirthday); // Normalize to start of day

          // If this year's birthday has already passed, consider next year's
          if (thisYearBirthday < today && !isSameDay(thisYearBirthday, today)) {
            thisYearBirthday = new Date(currentYear + 1, parsedDate.getMonth(), parsedDate.getDate());
            thisYearBirthday = startOfDay(thisYearBirthday); // Normalize to start of day
          }

          // Check if the birthday is today, in the current month (from today onwards), or next month
          const isTodayBirthday = isSameDay(thisYearBirthday, today);
          const isCurrentMonthUpcoming = isSameMonth(thisYearBirthday, today) && thisYearBirthday >= today;
          const isNextMonthUpcoming = isSameMonth(thisYearBirthday, nextMonthDate);

          if (isTodayBirthday || isCurrentMonthUpcoming || isNextMonthUpcoming) {
            birthdays.push({
              name: memberName,
              birthDate: thisYearBirthday,
              originalDateString: birthDateString,
            });
          }
        } catch (e) {
          // console.warn(`Could not parse birth date for member ${memberName}: ${birthDateString}`, e);
        }
      }
    });

    // Sort by day of the year
    return birthdays.sort((a, b) => getDayOfYear(a.birthDate) - getDayOfYear(b.birthDate));
  }, [members, isLoadingMembers]);

  if (isLoadingMembers) {
    return (
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
            <Cake className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
            Próximos Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errorMembers) {
    return (
      <Card className="glow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--danger-color))]">
            <AlertCircle className="h-5 w-5" />
            Erro Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[hsl(var(--muted-foreground))]">Falha ao carregar aniversariantes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--foreground))]">
          <Cake className="h-5 w-5 text-[hsl(var(--accent-turquoise))]" />
          Próximos Aniversariantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingBirthdays.length > 0 ? (
          <ScrollArea className="h-[200px] pr-4">
            <ul className="space-y-2">
              {upcomingBirthdays.map((bday, index) => (
                <li key={index} className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-turquoise))]" />
                  <span className="font-medium text-[hsl(var(--foreground))]">{bday.name.split(' ')[0]}</span>
                  <span>- {format(bday.birthDate, 'dd/MM', { locale: ptBR })}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-[hsl(var(--muted-foreground))]">Nenhum aniversariante próximo.</p>
        )}
      </CardContent>
    </Card>
  );
};