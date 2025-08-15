import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  useState,
  useRef,
  ChangeEvent,
  forwardRef,
  useImperativeHandle,
} from "react";

// Максимальное количество номеров для обзвона
const MAX_PHONE_NUMBERS = 50;

interface CallingNumbersProps {
  onNumbersChange?: (numbers: string[]) => void;
  userBalance: number;
  totalCost: number;
  mode?: "calls" | "sms"; // Новый проп для определения режима использования
}

export const CallingNumbers = forwardRef<
  { getPhoneNumbers: () => string[]; clearPhoneNumbers: () => void },
  CallingNumbersProps
>(({ onNumbersChange, userBalance, totalCost, mode = "calls" }, ref) => {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<"file" | "manual" | null>(
    null
  );
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Экспортируем методы для работы с номерами через ref
  useImperativeHandle(ref, () => ({
    getPhoneNumbers: () => phoneNumbers,
    clearPhoneNumbers: () => {
      updateNumbers([]);
      setInputMethod(null);
    },
  }));

  // Функция для нормализации номера телефона
  const normalizePhoneNumber = (phone: string): string => {
    // Удаляем все не-цифровые символы
    const digits = phone.replace(/\D/g, "");

    // Проверяем на российский номер
    if (digits.length === 11) {
      // Если номер начинается с 8 или 7, заменяем на +7
      if (digits.startsWith("8") || digits.startsWith("7")) {
        return `+7${digits.substring(1)}`;
      }
    }

    // Если номер не начинается с + и имеет 10 цифр, предполагаем российский номер без кода страны
    if (digits.length === 10) {
      return `+7${digits}`;
    }

    // Если номер уже в правильном формате или не российский, возвращаем как есть
    if (phone.startsWith("+")) {
      return phone;
    }

    // В других случаях пытаемся преобразовать к стандартному формату
    return digits.length > 0 ? `+${digits}` : phone;
  };

  // Обновляем родительский компонент при изменении списка номеров
  const updateNumbers = (newNumbers: string[]) => {
    // Ограничиваем количество номеров до MAX_PHONE_NUMBERS
    const limitedNumbers = newNumbers.slice(0, MAX_PHONE_NUMBERS);

    setPhoneNumbers(limitedNumbers);
    if (onNumbersChange) {
      onNumbersChange(limitedNumbers);
    }

    // Если было ограничение количества номеров, показываем уведомление
    if (newNumbers.length > MAX_PHONE_NUMBERS) {
      toast({
        title: `Превышен лимит номеров`,
        description: `Добавлено только ${MAX_PHONE_NUMBERS} номеров из ${newNumbers.length}. Максимальное количество номеров: ${MAX_PHONE_NUMBERS}.`,
        variant: "default",
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Разделение по переносу строки и удаление пустых строк
        const numbers = Array.from(
          new Set(
            content
              .split(/\r?\n/)
              .map((num) => num.trim())
              .filter((num) => num.length > 0)
              .map((num) => normalizePhoneNumber(num))
          )
        );

        if (numbers.length > 0) {
          updateNumbers(numbers);
          setInputMethod("file");

          const addedCount = Math.min(numbers.length, MAX_PHONE_NUMBERS);
          toast({
            title: "Номера загружены",
            description: `Загружено ${addedCount} номеров из файла${
              numbers.length > MAX_PHONE_NUMBERS
                ? ` (ограничено до ${MAX_PHONE_NUMBERS})`
                : ""
            }`,
          });
        } else {
          toast({
            title: "Ошибка загрузки",
            description: "Файл не содержит номеров телефона",
            variant: "destructive",
          });
        }
      }
      setIsLoadingFile(false);
    };

    reader.onerror = () => {
      setIsLoadingFile(false);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
  };

  const handleUpload = () => {
    if (inputMethod === "manual" && phoneNumbers.length > 0) {
      if (
        window.confirm(
          "У вас уже добавлены номера вручную. Загрузка файла очистит текущий список. Продолжить?"
        )
      ) {
        updateNumbers([]);
        fileInputRef.current?.click();
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleAddManualNumber = () => {
    if (!manualInput.trim()) return;

    // Нормализуем введенный номер
    const normalizedNumber = normalizePhoneNumber(manualInput.trim());

    if (inputMethod === "file" && phoneNumbers.length > 0) {
      if (
        window.confirm(
          "У вас уже загружены номера из файла. Добавление вручную очистит текущий список. Продолжить?"
        )
      ) {
        updateNumbers([normalizedNumber]);
        setManualInput("");
        setInputMethod("manual");
      }
    } else {
      // Проверяем, не превышен ли лимит номеров
      if (phoneNumbers.length >= MAX_PHONE_NUMBERS) {
        toast({
          title: "Превышен лимит номеров",
          description: `Достигнуто максимальное количество номеров: ${MAX_PHONE_NUMBERS}`,
          variant: "default",
        });
        return;
      }

      const uniqueNumbers = new Set([...phoneNumbers, normalizedNumber]);
      updateNumbers(Array.from(uniqueNumbers));
      setManualInput("");
      setInputMethod("manual");
    }
  };

  const handleRemoveNumber = (index: number) => {
    const newNumbers = [...phoneNumbers];
    newNumbers.splice(index, 1);
    updateNumbers(newNumbers);

    if (newNumbers.length === 0) {
      setInputMethod(null);
    }
  };

  // Функция для очистки всех номеров
  const handleClearAllNumbers = () => {
    if (phoneNumbers.length > 0) {
      if (window.confirm("Вы уверены, что хотите удалить все номера?")) {
        updateNumbers([]);
        setInputMethod(null);
        toast({
          title: "Список очищен",
          description: "Все номера удалены",
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {mode === "sms" ? "Получатели SMS" : "Номера для обзвона"}
        </h3>
        <span className="text-xs text-neutral-500">
          Максимум {MAX_PHONE_NUMBERS} номеров
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="file"
          accept=".txt"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={handleUpload}
          disabled={isLoadingFile}
          className={inputMethod === "manual" ? "opacity-50" : ""}
        >
          {isLoadingFile ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Обработка файла...</span>
            </>
          ) : (
            <>
              <span className="material-icons text-[18px] mr-1">
                upload_file
              </span>
              <span>Загрузить TXT файл</span>
            </>
          )}
        </Button>

        <span className="text-sm text-neutral-500 dark:text-neutral-400 self-center">
          или
        </span>

        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Введите номер телефона"
            className="max-w-xs"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            disabled={inputMethod === "file" || isLoadingFile}
          />
          <Button
            variant="outline"
            size="sm"
            className="sm:self-start"
            onClick={handleAddManualNumber}
            disabled={
              inputMethod === "file" ||
              isLoadingFile ||
              !manualInput.trim() ||
              phoneNumbers.length >= MAX_PHONE_NUMBERS
            }
          >
            <span className="material-icons text-[18px]">add</span>
          </Button>
        </div>
      </div>

      {phoneNumbers.length > 0 && (
        <div className="mt-4 border rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              Список уникальных номеров ({phoneNumbers.length}/
              {MAX_PHONE_NUMBERS}):
            </h4>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllNumbers}
              className="px-2 py-1 h-auto text-xs"
            >
              <span className="material-icons text-[16px] mr-1">delete</span>
              Удалить все
            </Button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {phoneNumbers.map((number, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
              >
                <span className="text-sm">{number}</span>
                <button
                  onClick={() => handleRemoveNumber(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <span className="material-icons text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>

          {phoneNumbers.length > 0 && mode === "calls" && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-green-600 dark:text-green-400">
              <p className="text-sm">Расчетная стоимость: {totalCost} ₽</p>
              <p className="text-sm">
                Фактическая цена может отличаться в зависимости от
                продолжительности звонков
              </p>
            </div>
          )}
          {mode === "calls" && totalCost > userBalance && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400">
              <p className="text-sm">У вас недостаточно средств для обзвона</p>
              <p className="text-sm">На балансе {userBalance} ₽</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
