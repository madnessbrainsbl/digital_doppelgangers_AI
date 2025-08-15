import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface SupportTicket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setTickets([
        {
          id: Date.now(),
          ...form,
          status: 'open',
          createdAt: new Date().toLocaleString('ru-RU')
        },
        ...tickets
      ]);
      setForm({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>Поддержка</CardTitle>
          <CardDescription>Свяжитесь с нашей командой — мы ответим на ваш вопрос или поможем с проблемой.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="Ваше имя" required />
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email для связи" type="email" required />
            </div>
            <Input name="subject" value={form.subject} onChange={handleChange} placeholder="Тема обращения" required />
            <Textarea name="message" value={form.message} onChange={handleChange} placeholder="Опишите ваш вопрос или проблему..." rows={4} required />
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Отправка...' : 'Отправить обращение'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Ваши обращения</CardTitle>
          <CardDescription>История обращений в поддержку</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">Пока нет обращений.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тема</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'open' ? 'secondary' : 'outline'}>
                        {t.status === 'open' ? 'Открыто' : 'Закрыто'}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 