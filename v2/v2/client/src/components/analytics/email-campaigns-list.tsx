import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  templateType: 'standard' | 'info' | 'marketing';
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: 'pending' | 'completed' | 'completed_with_errors' | 'failed';
  createdAt: string;
}

interface EmailCampaignsListProps {
  campaigns: EmailCampaign[];
  isLoading: boolean;
}

export default function EmailCampaignsList({ campaigns, isLoading }: EmailCampaignsListProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(campaigns.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const visibleCampaigns = campaigns.slice(startIndex, startIndex + itemsPerPage);
  
  const getSuccessRate = (success: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.round((success / total) * 100)}%`;
  };
  
  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // Перевод типа шаблона на русский
  const getTemplateTypeName = (type: string) => {
    switch(type) {
      case 'standard': return 'Стандартный';
      case 'info': return 'Информационный';
      case 'marketing': return 'Маркетинговый';
      default: return type;
    }
  };
  
  // Цвет и текст статуса
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">В процессе</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Завершено</Badge>;
      case 'completed_with_errors':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Завершено с ошибками</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Ошибка</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          Нет данных о рассылках за выбранный период
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Тема</TableHead>
            <TableHead>Шаблон</TableHead>
            <TableHead className="text-center">Получателей</TableHead>
            <TableHead className="text-center">Успешно</TableHead>
            <TableHead className="text-center">Статус</TableHead>
            <TableHead className="text-right">Дата</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleCampaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.id}</TableCell>
              <TableCell>{campaign.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{campaign.subject}</TableCell>
              <TableCell>{getTemplateTypeName(campaign.templateType)}</TableCell>
              <TableCell className="text-center">{campaign.recipientCount}</TableCell>
              <TableCell className="text-center">
                {campaign.successCount} ({getSuccessRate(campaign.successCount, campaign.recipientCount)})
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(campaign.status)}
              </TableCell>
              <TableCell className="text-right">{formatDate(campaign.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Страница {page} из {totalPages}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Назад
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Вперед
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}