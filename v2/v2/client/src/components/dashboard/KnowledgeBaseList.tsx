import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DocumentProps } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface KnowledgeBaseListProps {
  documents: DocumentProps[];
}

export function KnowledgeBaseList({ documents }: KnowledgeBaseListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">База знаний</CardTitle>
        <Link href="/knowledge" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          Управление
        </Link>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          {documents.map((document) => (
            <div 
              key={document.id}
              className="flex items-center p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
            >
              <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", document.iconBg)}>
                <span className="material-icons">{document.icon}</span>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">{document.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{document.fileSize}</p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{document.uploadedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full">
          <span className="material-icons text-[18px] mr-1">upload_file</span>
          <span>Загрузить файл</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default KnowledgeBaseList;
