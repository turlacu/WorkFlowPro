
'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { getTranslation } from '@/lib/translations';
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage

interface ProducerStat {
  producerId: string;
  assignmentsCreated: number;
}

interface OperatorStat {
  operatorId: string;
  assignmentsCompleted: number;
  assignmentsCommented: number;
}

type UserActivityTableProps = {
  title: string;
  data: ProducerStat[] | OperatorStat[];
  type: 'producer' | 'operator';
};

export function UserActivityTable({ title, data, type }: UserActivityTableProps) {
  const { currentLang } = useLanguage(); // Use context

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle> {/* Title is passed as prop, already translated potentially */}
          <CardDescription>{getTranslation(currentLang, 'UserActivityTableNoData')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle> {/* Title is passed as prop */}
        <CardDescription>
          {getTranslation(currentLang, 'UserActivityTableDescription', { type: getTranslation(currentLang, type === 'producer' ? 'Producer' : 'Operator')})}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{getTranslation(currentLang, 'UserActivityTableUserID')}</TableHead>
              {type === 'producer' && <TableHead>{getTranslation(currentLang, 'UserActivityTableAssignmentsCreated')}</TableHead>}
              {type === 'operator' && <TableHead>{getTranslation(currentLang, 'UserActivityTableAssignmentsCompleted')}</TableHead>}
              {type === 'operator' && <TableHead>{getTranslation(currentLang, 'UserActivityTableAssignmentsCommented')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={type === 'producer' ? (item as ProducerStat).producerId + index : (item as OperatorStat).operatorId + index}>
                <TableCell className="font-medium flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${(type === 'producer' ? (item as ProducerStat).producerId.charAt(0) : (item as OperatorStat).operatorId.charAt(0))}`} data-ai-hint="avatar person" />
                    <AvatarFallback>{(type === 'producer' ? (item as ProducerStat).producerId.charAt(0) : (item as OperatorStat).operatorId.charAt(0))}</AvatarFallback>
                  </Avatar>
                  {type === 'producer' ? (item as ProducerStat).producerId : (item as OperatorStat).operatorId}
                </TableCell>
                {type === 'producer' && <TableCell>{(item as ProducerStat).assignmentsCreated}</TableCell>}
                {type === 'operator' && <TableCell>{(item as OperatorStat).assignmentsCompleted}</TableCell>}
                {type === 'operator' && <TableCell>{(item as OperatorStat).assignmentsCommented}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>{getTranslation(currentLang, 'UserActivityTableCaption', { count: data.length.toString(), type: getTranslation(currentLang, type === 'producer' ? 'ProducersTitle' : 'OperatorsTitle') })}</TableCaption>
        </Table>
      </CardContent>
    </Card>
  );
}
