import React, { useEffect } from 'react';
import { Plus, Bot, MessageCircle, Trash2, MoreVertical, Settings, Crown, Sparkles, Cpu, Shield, Infinity, Target, User } from 'lucide-react';
import { DigitalTwinService } from '../services/digitalTwinService';
import { DigitalTwinData } from '../types/telegram';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface TwinsListProps {
  onCreateNew: () => void;
  onSelectTwin: (twin: DigitalTwinData) => void;
  onRetrainTwin: (twin: DigitalTwinData) => void;
  onOpenBehaviorSettings: (twin: DigitalTwinData) => void;
  twins: DigitalTwinData[];
  setTwins: React.Dispatch<React.SetStateAction<DigitalTwinData[]>>;
}

export function TwinsList({ onCreateNew, onSelectTwin, onRetrainTwin, onOpenBehaviorSettings, twins, setTwins }: TwinsListProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  useEffect(() => {
    loadTwins();
  }, []);

  const loadTwins = async () => {
    try {
      setIsLoading(true);
      const twinsList = await DigitalTwinService.getAllTwins();
      const uniqueTwins = twinsList.filter((twin, index, self) => 
        index === self.findIndex(t => t.id === twin.id)
      );
      setTwins(uniqueTwins);
    } catch (error) {
      console.error('Error loading twins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTwin = async (twinId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить этого цифрового двойника?')) return;
    try {
      setDeletingId(twinId);
      await DigitalTwinService.deleteTwin(twinId);
      setTwins(prev => prev.filter(twin => twin.id !== twinId));
    } catch (error) {
      alert('Ошибка при удалении цифрового двойника');
    } finally {
      setDeletingId(null);
    }
  };

  // --- UI ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto space-y-10 px-0 py-8">
      {/* Hero Section */}
      <Card className="w-full max-w-4xl mx-auto mb-8 border-none shadow-none bg-transparent">
        <CardContent className="flex flex-col items-center gap-6 p-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="px-4 py-1 text-base font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4" /> PREMIUM AI PLATFORM <Sparkles className="h-4 w-4 animate-pulse" />
            </Badge>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-primary/90 p-6 mb-2 flex items-center justify-center">
              <Bot className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-center">Мои цифровые двойники</CardTitle>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1"><Cpu className="h-4 w-4" /> Gemini 2.5 Pro</Badge>
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1"><Shield className="h-4 w-4" /> Enterprise Security</Badge>
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1"><Infinity className="h-4 w-4" /> Unlimited Scale</Badge>
            </div>
            <CardDescription className="text-center text-muted-foreground text-lg mt-4 max-w-2xl">
              Создавайте персонализированных ИИ-ассистентов, которые общаются точно как вы. Анализируем ваши сообщения и создаём уникальные цифровые двойники с вашим стилем общения.
            </CardDescription>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-2"><Bot className="h-7 w-7 text-primary" /></div>
            <CardTitle className="text-2xl">{twins.length}</CardTitle>
            <CardDescription>Активных двойников</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-2"><MessageCircle className="h-7 w-7 text-primary" /></div>
            <CardTitle className="text-2xl">{twins.reduce((sum, twin) => sum + twin.messagesCount, 0).toLocaleString()}</CardTitle>
            <CardDescription>Сообщений проанализировано</CardDescription>
          </CardHeader>
        </Card>
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-2"><Target className="h-7 w-7 text-primary" /></div>
            <CardTitle className="text-2xl">99.9%</CardTitle>
            <CardDescription>Точность анализа</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Twins List */}
      <div className="max-w-5xl mx-auto mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Ваши двойники</h2>
          <Button onClick={onCreateNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Новый двойник
          </Button>
        </div>
        <Separator className="mb-6" />
        {twins.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-lg">У вас пока нет цифровых двойников.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {twins.map((twin) => (
              <Card key={twin.id} className="group transition hover:shadow-lg cursor-pointer" onClick={() => onSelectTwin(twin)}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="rounded-xl bg-muted p-3">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate text-lg">{twin.name}</CardTitle>
                    <CardDescription className="truncate text-xs">{twin.profile?.communicationStyle || 'Без стиля'}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-auto">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectTwin(twin)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Открыть чат
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOpenBehaviorSettings(twin)}>
                        <Settings className="mr-2 h-4 w-4" /> Настройки
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleDeleteTwin(twin.id, e as any)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 pt-0">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                      {twin.profile?.communicationStyle || 'Без стиля'}
                    </Badge>
                    <Badge variant="outline" className="px-2 py-0.5 text-xs">
                      {twin.messagesCount} сообщений
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}