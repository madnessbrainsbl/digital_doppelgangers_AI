import { useState } from "react";
import MainLayout from "@/components/public/layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Схема валидации для отзыва
const testimonialSchema = z.object({
  title: z.string().min(5, "Заголовок должен содержать минимум 5 символов").max(100, "Заголовок не должен превышать 100 символов"),
  company: z.string().min(2, "Название компании должно содержать минимум 2 символа").max(100, "Название компании не должно превышать 100 символов"),
  position: z.string().min(2, "Должность должна содержать минимум 2 символа").max(100, "Должность не должна превышать 100 символов"),
  content: z.string().min(20, "Отзыв должен содержать минимум 20 символов").max(1000, "Отзыв не должен превышать 1000 символов"),
  rating: z.number().min(1, "Оценка должна быть минимум 1").max(5, "Оценка должна быть максимум 5"),
});

// Типы для отзывов
export interface Testimonial {
  id: number;
  userId: number;
  title: string;
  content: string;
  rating: number;
  company: string;
  position: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const TestimonialsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Получение всех одобренных отзывов
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ['/api/testimonials', 'approved'],
    queryFn: () => apiRequest({ 
      url: '/api/testimonials?status=approved', 
      method: 'GET' 
    })
  });
  
  // Форма для создания отзыва
  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      title: "",
      company: "",
      position: "",
      content: "",
      rating: 5,
    },
  });
  
  // Мутация для отправки отзыва
  const createTestimonialMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testimonialSchema>) => {
      return await apiRequest({
        url: '/api/testimonials',
        method: 'POST',
        body: {
          ...data,
          status: 'pending'  // Статус по умолчанию для новых отзывов
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Отзыв отправлен!",
        description: "Ваш отзыв успешно отправлен и будет опубликован после модерации.",
      });
      form.reset();
      setIsFormOpen(false);
      
      // Обновляем список отзывов
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      
      // Если пользователь авторизован, обновляем и его личные отзывы
      if (isAuthenticated && user) {
        queryClient.invalidateQueries({ queryKey: ['/api/users', user.id, 'testimonials'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Ошибка!",
        description: "Не удалось отправить отзыв. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
      console.error("Error creating testimonial:", error);
    }
  });
  
  // Обработчик отправки формы
  const onSubmit = (data: z.infer<typeof testimonialSchema>) => {
    createTestimonialMutation.mutate(data);
  };
  
  // Функция для отображения звездного рейтинга
  const renderStars = (rating: number) => {
    return Array(5).fill(null).map((_, index) => (
      <span key={index} className={`text-lg ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };
  
  // Функция для генерации инициалов из имени
  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Истории успеха клиентов</h1>
          <p className="text-xl text-gray-500 mb-4">
            Узнайте, как Асиссто помогает компаниям повышать эффективность коммуникаций
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Поделитесь вашим опытом</DialogTitle>
              <DialogDescription>
                Расскажите, как Асиссто помог вашему бизнесу. Ваш отзыв будет опубликован после проверки.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заголовок</FormLabel>
                      <FormControl>
                        <Input placeholder="Например: Асиссто упростил работу с клиентами" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Компания</FormLabel>
                        <FormControl>
                          <Input placeholder="Название вашей компании" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl>
                          <Input placeholder="Ваша должность" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ваш отзыв</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Опишите ваш опыт работы с Асиссто..." 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Оценка</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              type="button"
                              variant="ghost"
                              className={`p-1 ${star <= field.value ? 'text-yellow-400' : 'text-gray-300'}`}
                              onClick={() => form.setValue('rating', star)}
                            >
                              <span className="text-2xl">★</span>
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>Выберите оценку от 1 до 5 звезд</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createTestimonialMutation.isPending}>
                    {createTestimonialMutation.isPending ? "Отправка..." : "Отправить отзыв"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-24"></div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className="w-4 h-4 mx-0.5 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : testimonials?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{testimonial.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {testimonial.company}
                    </Badge>
                  </div>
                  <CardDescription>{testimonial.position}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 prose-sm">
                  <p>{testimonial.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage 
                        src={testimonial.user?.avatar} 
                        alt={testimonial.user?.name || "User"}
                      />
                      <AvatarFallback>
                        {getInitials(testimonial.user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {testimonial.user?.name || "Пользователь"}
                    </span>
                  </div>
                  <div className="flex" aria-label={`Рейтинг: ${testimonial.rating} из 5`}>
                    {renderStars(testimonial.rating)}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-medium mb-2">Пока нет отзывов</h3>
            <p className="text-gray-500 mb-6">Будьте первым, кто оставит отзыв о платформе Асиссто!</p>
            {isAuthenticated ? (
              <Button onClick={() => setIsFormOpen(true)}>Оставить отзыв</Button>
            ) : (
              <Button variant="secondary">Войдите, чтобы оставить отзыв</Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TestimonialsPage;