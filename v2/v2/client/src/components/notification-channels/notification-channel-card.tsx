import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Edit, Link2, List, Plus, Settings, User } from "lucide-react";
import { DialogDelete } from "./dialog-delete";
import { Assistant } from "@shared/schema";
import { Popover, PopoverContent } from "../ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

// Типы для данных
interface NotificationChannel {
  id: number;
  name: string;
  type: string;
  status: string;
  settings: Record<string, any>;
  createdAt?: string;
  createdBy: number;
}

interface OpenAiFunction {
  id: number;
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  channelId?: number;
  createdAt?: string;
  createdBy: number;
}

interface NotificationChannelCardProps {
  channel: NotificationChannel;
  channelFunctions: OpenAiFunction[];
  onEditChannel: (channel: NotificationChannel) => void;
  onEditFunction: (func: OpenAiFunction, editFunctionSuccess: boolean) => void;
  onCreateFunction: (channelId: number) => void;
  onDeleteChannel: (channelId: number) => void;
  onDeleteFunction: (functionId: number) => void;
  createdUserId: number;
  userRole: string | undefined;
  currentUserId: number | undefined;
}

export function NotificationChannelCard({
  channel,
  channelFunctions,
  onEditChannel,
  onEditFunction,
  onCreateFunction,
  onDeleteChannel,
  onDeleteFunction,
  createdUserId,
  userRole,
  currentUserId,
}: NotificationChannelCardProps) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получение списка ассистентов для канала
  const { data: assistants, isLoading: isLoadingAssistants } = useQuery<
    { id: number; name: string; role: string; functionId: number }[]
  >({
    queryKey: [`/api/channels/${channel.id}/assistants`],
    enabled: !!channel.id,
  });

  return (
    <Card key={channel.id} className="relative overflow-hidden">
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-start mb-4 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3
                className={cn(
                  "text-lg font-medium break-words",
                  userRole === "admin" &&
                    currentUserId === channel.createdBy &&
                    "bg-green-300 px-2 rounded-md"
                )}
              >
                {channel.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {channel.type}
                </Badge>
                {userRole && userRole === "admin" && (
                  <span className="text-xs text-muted-foreground">
                    id пользователя: {createdUserId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditChannel(channel)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DialogDelete
              onDelete={() => onDeleteChannel(channel.id)}
              id={channel.id}
              title="Удалить канал оповещения"
              description="Вы уверены, что хотите удалить этот канал?"
              deletedSuccess={
                assistants && assistants.length > 0 ? true : false
              }
              assistants={assistants}
            />
          </div>
        </div>

        <div className="bg-muted/30 rounded-md p-3 text-xs overflow-hidden text-ellipsis my-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">Тип:</span>
            <span>{channel.type}</span>
          </div>
          {channel.type === "telegram" &&
            channel.settings &&
            channel.settings.chatId && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Чат ID:</span>
                <span className="break-all">{channel.settings.chatId}</span>
              </div>
            )}
          {channel.type === "email" &&
            channel.settings &&
            channel.settings.email && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Email:</span>
                <span className="break-all">{channel.settings.email}</span>
              </div>
            )}
        </div>

        {/* Функции для этого канала */}
        <div className="mt-4">
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
            <h4 className="font-medium">OpenAI функции канала</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateFunction(channel.id)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Добавить функцию</span>
            </Button>
          </div>

          {channelFunctions.length > 0 ? (
            <div className="space-y-2">
              {channelFunctions.map((func) => (
                <div
                  key={func.id}
                  className="border rounded-md p-3 flex flex-wrap sm:flex-nowrap justify-between items-center hover:bg-muted/30 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{func.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {func.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {assistants &&
                      assistants.length > 0 &&
                      assistants.some(
                        (assistant) => assistant.functionId === func.id
                      ) && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <List className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <h3 className="text-sm font-medium">
                              Ассистенты, использующие функцию
                            </h3>
                            <hr className="my-2" />
                            {assistants &&
                              assistants.length > 0 &&
                              assistants.map((assistant) => (
                                <p key={assistant.id}>{assistant.name}</p>
                              ))}
                          </PopoverContent>
                        </Popover>
                      )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onEditFunction(
                          func,
                          assistants &&
                            assistants.length > 0 &&
                            assistants.some(
                              (assistant) => assistant.functionId === func.id
                            )
                            ? false
                            : true
                        )
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DialogDelete
                      onDelete={() => onDeleteFunction(func.id)}
                      id={func.id}
                      title="Удалить функцию"
                      description="Вы уверены, что хотите удалить эту функцию?"
                      deletedSuccess={
                        assistants &&
                        assistants.length > 0 &&
                        assistants.some(
                          (assistant) => assistant.functionId === func.id
                        )
                          ? true
                          : false
                      }
                      assistants={assistants}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 bg-muted/10 rounded-md">
              <p className="text-sm text-muted-foreground">
                В этом канале пока нет функций
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setLocation(`/assistants`)}
        >
          <Link2 className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Привязать к ассистенту</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
