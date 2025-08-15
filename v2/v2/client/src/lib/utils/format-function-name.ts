// Преобразует русское название в английскую транслитерацию с подчеркиваниями
export const formatFunctionName = (name: string): string => {
  if (!name) return "unknown_function";

  // Словарь транслитерации
  const translitMap: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "E",
    Ж: "ZH",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "H",
    Ц: "TS",
    Ч: "CH",
    Ш: "SH",
    Щ: "SCH",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "YU",
    Я: "YA",
  };

  // Транслитерация и замена пробелов на подчеркивания
  let result = "";
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (translitMap[char]) {
      result += translitMap[char];
    } else if (/[a-zA-Z0-9]/.test(char)) {
      // Оставляем английские буквы и цифры как есть
      result += char;
    } else if (/\s/.test(char)) {
      // Заменяем пробелы на подчеркивания
      result += "_";
    }
    // Игнорируем другие символы
  }

  // Если результат пустой, возвращаем значение по умолчанию
  const finalResult = result || "unknown_function";

  // Логируем результат транслитерации
  console.log(`Function name transliteration: "${name}" -> "${finalResult}"`);

  return finalResult;
};
