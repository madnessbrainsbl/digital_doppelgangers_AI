import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AssistantProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface AssistantListProps {
  assistants: AssistantProps[];
}

const statusLabels = {
  active: 'Активен',
  training: 'Обучение',
  inactive: 'Неактивен'
};

const statusClasses = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  training: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
  inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export function AssistantList({ assistants }: AssistantListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Недавние ассистенты</CardTitle>
        <Link href="/assistants" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          Все ассистенты
        </Link>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          {assistants.map((assistant) => (
            <div 
              key={assistant.id}
              className="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", assistant.iconBg)}>
                <span className="material-icons">{assistant.icon}</span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{assistant.name}</p>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", statusClasses[assistant.status])}>
                    {statusLabels[assistant.status]}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{assistant.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/assistants/new">
            <span className="material-icons text-[18px] mr-1">add</span>
            <span>Создать ассистента</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AssistantList;
