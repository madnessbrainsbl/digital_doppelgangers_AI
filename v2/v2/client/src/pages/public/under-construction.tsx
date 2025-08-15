import MainLayout from "@/components/public/layout";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function UnderConstructionPage() {
  return (
    <MainLayout>
      <section className="py-24 bg-gradient-to-b from-primary/5 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Страница в разработке
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Мы активно работаем над этой страницей. Скоро здесь появится полезная информация.
            </p>
            <Link href="/">
              <div className="inline-flex items-center text-primary font-medium hover:underline cursor-pointer">
                <ChevronLeft className="h-4 w-4 mr-1" /> Вернуться на главную
              </div>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}