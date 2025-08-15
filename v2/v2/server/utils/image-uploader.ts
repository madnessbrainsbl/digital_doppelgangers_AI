import axios from "axios";
import "dotenv/config";

/**
 * Загружает изображение с временного URL Авито на стабильный сервер Bytescale
 * @param imageUrl URL изображения от Авито
 * @returns Новый стабильный URL
 */
export async function uploadImageByUrlToStableServer(
  imageUrl: string
): Promise<string> {
  try {
    if (!process.env.BYTESCALE_APY_ACCAUNT || !process.env.BYTESCALE_APY_KEY) {
      console.log(
        `[Image Uploader] Отсутствуют настройки BYTESCALE_APY_ACCAUNT или BYTESCALE_APY_KEY`
      );
      return imageUrl; // Возвращаем исходный URL если нет настроек
    }

    console.log(
      `[Image Uploader] Загрузка изображения на Bytescale: ${imageUrl}`
    );

    const response = await axios.post(
      `https://api.bytescale.com/v2/accounts/${process.env.BYTESCALE_APY_ACCAUNT}/uploads/url`,
      {
        url: imageUrl,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BYTESCALE_APY_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.fileUrl) {
      console.log(
        `[Image Uploader] Изображение успешно загружено на Bytescale: ${response.data.fileUrl}`
      );
      return response.data.fileUrl;
    } else {
      console.log(`[Image Uploader] Некорректный ответ от сервиса Bytescale`);
      throw new Error("Некорректный ответ от сервиса Bytescale");
    }
  } catch (error) {
    console.error(
      `[Image Uploader] Ошибка загрузки изображения на Bytescale:`,
      error
    );
    return imageUrl; // В случае ошибки возвращаем исходный URL
  }
}
