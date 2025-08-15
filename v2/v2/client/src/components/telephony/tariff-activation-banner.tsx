import { Link } from "wouter";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Phone, Building } from "lucide-react";

export function TariffActivationBanner() {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
          Для использования телефонии необходимо подключить тариф
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Выберите подходящий тариф для вашего бизнеса
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Тариф Стандарт */}
        <Card className="border-2 border-neutral-200 dark:border-neutral-800 hover:border-primary/70 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex justify-center items-center">
              <CardTitle className="text-xl flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Стандарт
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4 flex flex-col items-center">
            <div className="text-3xl font-bold text-center mb-3">500 минут</div>
            <ul className="list-disc text-left">
              <li>Автоматический обзвон по списку номеров</li>
              <li>Подключение ассистента к автообзвону</li>
              <li>Выполнение пользовательской функции</li>
              <li>Расшифровка звонков</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/pricing">
              <Button>Подключить Стандарт</Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Тариф Корпоративный */}
        <Card className="border-2 border-neutral-200 dark:border-neutral-800 hover:border-primary/70 hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex justify-center items-center">
              <CardTitle className="text-xl flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Корпоративный
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4 flex flex-col items-center">
            <div className="text-3xl font-bold text-center mb-3">
              2000 минут
            </div>
            <ul className="list-disc text-left">
              <li>Автоматический обзвон по списку номеров</li>
              <li>Подключение ассистента к автообзвону</li>
              <li>Выполнение пользовательской функции</li>
              <li>Расшифровка звонков</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/pricing">
              <Button>Подключить Корпоративный</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
