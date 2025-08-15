import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const faqs = [
  {
    question: 'Как создать цифрового двойника?',
    answer: 'Перейдите в раздел "Создать", загрузите экспорт переписки из Telegram и следуйте инструкциям.'
  },
  {
    question: 'Как подключить Telegram бота?',
    answer: 'В разделе "Интеграции" выберите "Telegram Bot" и следуйте шагам подключения.'
  },
  {
    question: 'Как работает клонирование голоса?',
    answer: 'В разделе "Клонирование" загрузите голосовой файл и дождитесь завершения обучения модели.'
  },
  {
    question: 'Как связаться с поддержкой?',
    answer: 'Используйте форму на странице "Поддержка" или напишите на support@yourdomain.com.'
  },
  {
    question: 'Мои данные в безопасности?',
    answer: 'Да, мы используем современные методы шифрования и не передаём ваши данные третьим лицам.'
  }
];

export function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-10">
      <Card>
        <CardHeader>
          <CardTitle>FAQ</CardTitle>
          <CardDescription>Часто задаваемые вопросы о платформе цифровых двойников</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem value={String(idx)} key={idx}>
                <AccordionTrigger className="text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
} 