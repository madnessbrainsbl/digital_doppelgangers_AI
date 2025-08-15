import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

const assistantSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Название должно содержать минимум 2 символа" }),
  description: z.string().optional(),
  role: z.string().min(1, { message: "Выберите роль ассистента" }),
  settings: z
    .object({
      tone: z.string().default("professional"),
      language: z.string().default("ru"),
    })
    .default({}),
});

type AssistantFormValues = z.infer<typeof assistantSchema>;

export function AssistantForm() {
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantSchema),
    defaultValues: {
      name: "",
      description: "",
      role: "",
      settings: {
        tone: "professional",
        language: "ru",
      },
    },
  });

  async function onSubmit(data: AssistantFormValues) {
    setIsSubmitting(true);
    try {
      // Add createdBy property
      const dataToSubmit = {
        ...data,
        createdBy: 1, // In a real app, this would be the logged-in user ID
        status: "inactive",
      };

      const response = await apiRequest(
        "POST",
        "/api/assistants",
        dataToSubmit
      );

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: "Ассистент успешно создан.",
        });
        navigate("/assistants");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать ассистента.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Создание нового ассистента</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Основные настройки</TabsTrigger>
                <TabsTrigger value="advanced">
                  Дополнительные настройки
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название ассистента</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Например: Менеджер продаж"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание (необязательно)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Кратко опишите, чем занимается этот ассистент"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Роль ассистента</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите роль" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sales">Менеджер продаж</SelectItem>
                          <SelectItem value="support">
                            Техническая поддержка
                          </SelectItem>
                          <SelectItem value="consultant">
                            Консультант по продуктам
                          </SelectItem>
                          <SelectItem value="hr">HR-менеджер</SelectItem>
                          <SelectItem value="custom">Другое</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="settings.tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тональность общения</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тональность" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">
                            Профессиональная
                          </SelectItem>
                          <SelectItem value="friendly">Дружелюбная</SelectItem>
                          <SelectItem value="technical">Техническая</SelectItem>
                          <SelectItem value="casual">Неформальная</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="settings.language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Язык общения</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите язык" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="en">Английский</SelectItem>
                          <SelectItem value="multilingual">
                            Многоязычный
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/assistants")}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="material-icons animate-spin mr-2">
                    autorenew
                  </span>
                  Создание...
                </>
              ) : (
                "Создать ассистента"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}

export default AssistantForm;
