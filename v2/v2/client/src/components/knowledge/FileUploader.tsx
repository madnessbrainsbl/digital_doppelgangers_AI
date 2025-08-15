import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

export default function FileUploader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Mock progress updates
      const mockProgressUpdates = () => {
        const totalSteps = 10;
        let currentStep = 0;
        
        const interval = setInterval(() => {
          currentStep++;
          setUploadProgress((currentStep / totalSteps) * 100);
          
          if (currentStep === totalSteps) {
            clearInterval(interval);
          }
        }, 300);
      };

      mockProgressUpdates();

      const response = await fetch('/api/knowledge', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка загрузки файла');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/knowledge'] });
      toast({
        title: 'Успех',
        description: 'Файл успешно загружен',
      });
      setFile(null);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось загрузить файл: ${error.message}`,
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('createdBy', String(user?.id || 1));

    uploadMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Загрузка файла</CardTitle>
      </CardHeader>
      <CardContent>
        {!file ? (
          <div 
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="material-icons text-4xl text-neutral-400 dark:text-neutral-500 mb-2">
              cloud_upload
            </span>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              Перетащите файл сюда или нажмите для выбора
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Поддерживаемые форматы: PDF, DOCX, XLSX, TXT, CSV
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.txt,.csv"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center p-2 border border-neutral-200 dark:border-neutral-700 rounded">
              <div className="w-10 h-10 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center mr-3">
                <span className="material-icons">
                  {file.type.includes('pdf') ? 'picture_as_pdf' : 
                   file.type.includes('spreadsheet') ? 'insert_chart' : 
                   file.type.includes('word') ? 'description' : 'insert_drive_file'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button 
                onClick={handleCancel}
                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          disabled={!file || uploadMutation.isPending}
        >
          Отмена
        </Button>
        <Button 
          disabled={!file || uploadMutation.isPending}
          onClick={handleUpload}
        >
          {uploadMutation.isPending ? "Загрузка..." : "Загрузить"}
        </Button>
      </CardFooter>
    </Card>
  );
}
