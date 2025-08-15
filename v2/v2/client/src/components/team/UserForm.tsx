import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const userFormSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["user", "referral", "manager", "admin"]),
    status: z.enum(["active", "inactive", "suspended"]).default("active"),
    plan: z.enum(["free", "basic", "standart", "enterprise"]).default("free"),
    managerId: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      // Проверяем, что хотя бы одно из полей (email или phone) заполнено
      return data.email || data.phone;
    },
    {
      message: "Необходимо указать email или телефон",
      path: ["email"], // Указываем путь к полю, чтобы сообщение об ошибке отображалось под полем email
    }
  );

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    plan: string | null;
    managerId: number | null;
  };
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role as any,
      status: user.status as any,
      plan: (user.plan as any) || "free",
      managerId: user.managerId || null,
    },
  });

  const handleSubmit = (data: UserFormData) => {
    // Преобразуем пустую строку email в null
    const processedData = {
      ...data,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    };
    onSubmit(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Имя</FormLabel>
              <FormControl>
                <Input
                  placeholder="Имя пользователя"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Полное имя пользователя или название компании
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Email пользователя для входа в систему
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Телефон</FormLabel>
              <FormControl>
                <Input
                  placeholder="+7XXXXXXXXXX"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Номер телефона пользователя в формате +7XXXXXXXXXX
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Роль</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="referral">Реферал</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Роль определяет права доступа пользователя
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-1">
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
                  <SelectItem value="suspended">Заблокирован</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Текущий статус аккаунта пользователя
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Тариф</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тариф" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="free">Бесплатный</SelectItem>
                  <SelectItem value="basic">Базовый</SelectItem>
                  <SelectItem value="standart">Стандартный</SelectItem>
                  <SelectItem value="enterprise">Корпоративный</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Текущий тарифный план пользователя
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-3">
          <Button variant="outline" onClick={onCancel} type="button" size="sm">
            Отмена
          </Button>
          <Button type="submit" size="sm">
            Сохранить
          </Button>
        </div>
      </form>
    </Form>
  );
}
