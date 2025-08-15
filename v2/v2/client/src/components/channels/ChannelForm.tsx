import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChannelSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Channel } from "@shared/schema";

// Extend the schema with additional validation
const formSchema = insertChannelSchema.extend({
  name: z.string().min(3, {
    message: "Название канала должно содержать не менее 3 символов",
  }),
});

interface ChannelFormProps {
  editingChannel?: Channel;
  onCancel: () => void;
}

export default function ChannelForm({ editingChannel, onCancel }: ChannelFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(editingChannel?.type || "telegram");

  const defaultValues: z.infer<typeof formSchema> = {
    name: editingChannel?.name || "",
    type: editingChannel?.type || "telegram",
    status: editingChannel?.status || "inactive",
    configuration: editingChannel?.configuration || {},
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Update form when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue("type", value);
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (editingChannel) {
        const res = await apiRequest("PUT", `/api/channels/${editingChannel.id}`, values);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/channels", values);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      toast({
        title: "Успешно",
        description: editingChannel 
          ? "Канал успешно обновлен" 
          : "Канал успешно создан",
      });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось ${editingChannel ? 'обновить' : 'создать'} канал: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{editingChannel ? "Редактировать канал" : "Добавить новый канал"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название канала</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название канала" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Активен</SelectItem>
                      <SelectItem value="inactive">Неактивен</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="text-base">Тип канала</FormLabel>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="telegram">Telegram</TabsTrigger>
                  <TabsTrigger value="web">Веб-чат</TabsTrigger>
                  <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                </TabsList>

                {/* Telegram Configuration */}
                <TabsContent value="telegram" className="border rounded-md p-4 space-y-4">
                  <h3 className="text-sm font-medium">Настройки Telegram</h3>
                  
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Токен бота</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите токен Telegram бота" 
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              token: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.token || ""}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Имя бота</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Введите имя бота"
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              botName: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.botName || ""}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </TabsContent>

                {/* Web Chat Configuration */}
                <TabsContent value="web" className="border rounded-md p-4 space-y-4">
                  <h3 className="text-sm font-medium">Настройки веб-чата</h3>
                  
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>URL сайта</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://вашсайт.ru"
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              websiteUrl: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.websiteUrl || ""}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Цвет виджета</FormLabel>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Input 
                            type="color"
                            className="w-12 h-10 p-1"
                            onChange={(e) => {
                              const config = form.getValues("configuration") || {};
                              form.setValue("configuration", {
                                ...config,
                                widgetColor: e.target.value
                              });
                            }}
                            defaultValue={(form.getValues("configuration") as any)?.widgetColor || "#6366F1"}
                          />
                          <Input 
                            placeholder="#6366F1"
                            className="flex-1"
                            onChange={(e) => {
                              const config = form.getValues("configuration") || {};
                              form.setValue("configuration", {
                                ...config,
                                widgetColor: e.target.value
                              });
                            }}
                            defaultValue={(form.getValues("configuration") as any)?.widgetColor || "#6366F1"}
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  </div>
                </TabsContent>

                {/* WhatsApp Configuration */}
                <TabsContent value="whatsapp" className="border rounded-md p-4 space-y-4">
                  <h3 className="text-sm font-medium">Настройки WhatsApp</h3>
                  
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>ID аккаунта</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ID аккаунта WhatsApp Business"
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              accountId: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.accountId || ""}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>API ключ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="API ключ WhatsApp Business"
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              apiKey: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.apiKey || ""}
                        />
                      </FormControl>
                    </FormItem>
                    
                    <FormItem>
                      <FormLabel>Номер телефона</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+7XXXXXXXXXX"
                          onChange={(e) => {
                            const config = form.getValues("configuration") || {};
                            form.setValue("configuration", {
                              ...config,
                              phoneNumber: e.target.value
                            });
                          }}
                          defaultValue={(form.getValues("configuration") as any)?.phoneNumber || ""}
                        />
                      </FormControl>
                    </FormItem>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button onClick={onCancel} variant="outline">Отмена</Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={mutation.isPending}
        >
          {mutation.isPending 
            ? (editingChannel ? "Обновление..." : "Создание...") 
            : (editingChannel ? "Обновить канал" : "Создать канал")}
        </Button>
      </CardFooter>
    </Card>
  );
}
