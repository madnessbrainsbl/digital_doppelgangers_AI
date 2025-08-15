import axios from "axios";
import { Channel } from "../../shared/schema";
import { IStorage } from "../storage";

/**
 * Базовый URL для Avito API
 */
const AVITO_API_BASE_URL = "https://api.avito.ru";

/**
 * URL для получения токена авторизации
 */
const AVITO_TOKEN_URL = "https://api.avito.ru/token";

/**
 * Интерфейс для Avito диалога (чата)
 */
export interface AvitoConversation {
  id: number;
  type: string;
  lastMessageId: number;
  lastMessage: AvitoMessage;
  unreadCount?: number;
  clientName?: string;
  articleInfo?: {
    title: string;
    price: string;
    url: string;
    image?: string;
  };
}

/**
 * Интерфейс для Avito сообщения
 */
export interface AvitoMessage {
  id: number;
  date: number;
  chatId: number;
  senderId: number;
  text: string;
  attachments?: any[];
  out?: number; // 1 для исходящих сообщений (как в VK)
  read?: boolean;
}

/**
 * Интерфейс для подписки на вебхук Avito
 */
export interface AvitoWebhookSubscription {
  id: number;
  url: string;
  title: string;
  version?: string;
}

/**
 * Интерфейс для полного диалога с информацией об объявлении
 */
export interface AvitoFullDialog {
  articleInfo: {
    title: string;
    price: string;
    url: string;
    image?: string;
  };
  messages: AvitoMessage[];
  clientName?: string; // Имя клиента (собеседника)
}

/**
 * Сервис для работы с API Avito
 */
export class AvitoService {
  /**
   * Получает токен авторизации для работы с Avito API
   * @param clientId Client ID из настроек канала
   * @param clientSecret Client Secret из настроек канала
   * @returns Токен авторизации в формате "Bearer XXX"
   */
  async getAccessToken(
    clientId: string,
    clientSecret: string
  ): Promise<string> {
    try {
      console.log(
        `[Avito] Получение токена авторизации с Client ID: ${clientId}`
      );

      const response = await axios.post(
        AVITO_TOKEN_URL,
        {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.error) {
        console.error("[Avito] API error:", response.data.error);
        throw new Error(
          response.data.error.message || "Ошибка при получении токена Avito"
        );
      }

      const accessToken = response.data.access_token;
      const tokenType = response.data.token_type || "Bearer";
      console.log(`[Avito] Токен авторизации успешно получен`);

      return `${tokenType} ${accessToken}`;
    } catch (error) {
      console.error("[Avito] Error getting access token:", error);
      throw error;
    }
  }

  /**
   * Получает список чатов из Avito с поддержкой пагинации
   * @param channel Канал Avito с настройками
   * @param count Количество диалогов для получения (по умолчанию 50)
   * @param offset Смещение для пагинации (по умолчанию 0)
   * @returns Массив диалогов Avito
   */
  async getConversations(
    channel: Channel,
    count: number = 50,
    offset: number = 0
  ): Promise<AvitoConversation[]> {
    const { clientId, clientSecret, profileId } = channel.settings as {
      clientId: string;
      clientSecret: string;
      profileId: string;
    };

    if (!clientId || !clientSecret || !profileId) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret или profileId)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(
        `[Avito] Получение диалогов для профиля ${profileId}, лимит: ${count}, смещение: ${offset}`
      );

      const accessToken = await this.getAccessToken(clientId, clientSecret);
      // Для Avito нужно использовать только цифры в profileId (удаляем все пробелы и не-цифры)
      const cleanProfileId = profileId.replace(/\D/g, "");
      console.log(
        `[Avito] Оригинальный profileId: ${profileId}, очищенный: ${cleanProfileId}`
      );
      const url = `${AVITO_API_BASE_URL}/messenger/v2/accounts/${cleanProfileId}/chats?limit=${count}&offset=${offset}`;

      console.log(`[Avito] Отправка запроса на URL: ${url}`);

      const response = await axios.get(url, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.data || !response.data.chats) {
        console.error(
          "[Avito] API вернул неожиданный формат данных:",
          response.data
        );
        return [];
      }

      const chats = response.data.chats;
      console.log(`[Avito] Получено ${chats.length} диалогов`);

      return chats.map((chat: any) => {
        const lastMessage = chat.last_message || {};
        const messageContent = lastMessage.content || {};
        const messageText = messageContent.text
          ? messageContent.text
          : messageContent.image
          ? "Фотография"
          : "";

        return {
          id: chat.id,
          type: "user",
          clientName:
            chat.users && chat.users.length > 0
              ? chat.users[0].name
              : "Пользователь Avito",
          lastMessageId: lastMessage.id || 0,
          lastMessage: {
            id: lastMessage.id || 0,
            date: new Date(lastMessage.created || Date.now()).getTime(),
            chatId: chat.id,
            senderId: lastMessage.author_id || 0,
            text: messageText,
            out: lastMessage.direction === "out" ? 1 : 0,
            read: lastMessage.read || false,
          },
          unreadCount:
            !lastMessage.read && lastMessage.direction === "in" ? 1 : 0,
          articleInfo:
            chat.context && chat.context.value
              ? {
                  title: chat.context.value.title || "Объявление",
                  price: chat.context.value.price_string || "",
                  url: chat.context.value.url || "",
                  image:
                    chat.context.value.images && chat.context.value.images.main
                      ? chat.context.value.images.main[
                          Object.keys(chat.context.value.images.main)[0]
                        ]
                      : undefined,
                }
              : undefined,
        };
      });
    } catch (error) {
      console.error("[Avito] Error getting conversations:", error);
      throw error;
    }
  }

  /**
   * Алиас для получения диалогов из Avito
   * @param channel Канал Avito
   * @param count Количество диалогов
   * @param offset Смещение
   * @returns Список диалогов
   */
  async getDialogs(
    channel: Channel,
    count: number = 50,
    offset: number = 0
  ): Promise<AvitoConversation[]> {
    return this.getConversations(channel, count, offset);
  }

  /**
   * Получает полную историю диалога включая информацию о товаре
   * @param channel Канал Avito
   * @param chatId ID чата
   * @param count Количество сообщений
   * @param offset Смещение
   * @returns Полная информация о диалоге
   */
  async getFullDialog(
    channel: Channel,
    chatId: string | number,
    count: number = 50,
    offset: number = 0
  ): Promise<AvitoFullDialog> {
    const { clientId, clientSecret, profileId } = channel.settings as {
      clientId: string;
      clientSecret: string;
      profileId: string;
    };

    if (!clientId || !clientSecret || !profileId) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret или profileId)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Получение полной истории диалога ${chatId}`);

      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Для Avito API нужно использовать только цифры в profileId
      const cleanProfileId = profileId.replace(/\D/g, "");
      console.log(
        `[Avito] Оригинальный profileId: ${profileId}, очищенный: ${cleanProfileId}`
      );

      // Получаем информацию о чате
      const chatUrl = `${AVITO_API_BASE_URL}/messenger/v2/accounts/${cleanProfileId}/chats/${chatId}`;
      console.log(`[Avito] Запрос информации о чате: ${chatUrl}`);
      const chatResponse = await axios.get(chatUrl, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      // Получаем сообщения чата
      const messagesUrl = `${AVITO_API_BASE_URL}/messenger/v3/accounts/${cleanProfileId}/chats/${chatId}/messages/?limit=${count}&offset=${offset}`;
      console.log(`[Avito] Запрос сообщений чата: ${messagesUrl}`);
      const messagesResponse = await axios.get(messagesUrl, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      // Информация о товаре
      const contextValue =
        chatResponse.data.context && chatResponse.data.context.value
          ? chatResponse.data.context.value
          : null;

      const articleInfo = {
        title: contextValue?.title || "Объявление",
        price: contextValue?.price_string || "",
        url: contextValue?.url || "",
        image:
          contextValue?.images && contextValue.images.main
            ? contextValue.images.main[Object.keys(contextValue.images.main)[0]]
            : undefined,
      };

      // Форматирование сообщений
      const messages = messagesResponse.data.messages.map((msg: any) => {
        const attachments = [];
        if (msg.content && msg.content.image) {
          attachments.push({
            type: "photo",
            content:
              msg.content.image.sizes["1280x960"] ||
              msg.content.image.sizes[Object.keys(msg.content.image.sizes)[0]],
          });
        }

        return {
          id: msg.id,
          date: new Date(msg.created).getTime(),
          chatId: chatId,
          senderId: msg.author_id,
          text: msg.content?.text || "",
          attachments: attachments,
          out: msg.direction === "out" ? 1 : 0,
          read: msg.isRead || false,
        };
      });

      console.log(
        `[Avito] Получено ${messages.length} сообщений для диалога ${chatId}`
      );

      // Получаем имя клиента, если доступно
      const clientName =
        chatResponse.data.opponent?.name ||
        chatResponse.data.chat?.opponent?.name ||
        chatResponse.data.user?.name ||
        "Собеседник";

      return {
        articleInfo,
        messages,
        clientName,
      };
    } catch (error) {
      console.error(`[Avito] Error getting full dialog ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Получает историю сообщений чата Avito
   * @param channel Канал Avito
   * @param chatId ID чата
   * @param count Количество сообщений
   * @param offset Смещение
   * @returns Список сообщений
   */
  async getConversationHistory(
    channel: Channel,
    chatId: string | number,
    count: number = 50,
    offset: number = 0
  ): Promise<AvitoMessage[]> {
    try {
      const fullDialog = await this.getFullDialog(
        channel,
        chatId,
        count,
        offset
      );
      return fullDialog.messages;
    } catch (error) {
      console.error(
        `[Avito] Error getting conversation history for chat ${chatId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Отправляет сообщение в чат Avito
   * @param channel Канал Avito
   * @param chatId ID чата
   * @param message Текст сообщения
   * @param attachment URL вложения (если есть)
   * @returns Результат отправки сообщения
   */
  async sendMessage(
    channel: Channel,
    chatId: string | number,
    message: string,
    attachment?: string
  ): Promise<{ message_id: number }> {
    const { clientId, clientSecret, profileId } = channel.settings as {
      clientId: string;
      clientSecret: string;
      profileId: string;
    };

    if (!clientId || !clientSecret || !profileId) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret или profileId)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Отправка сообщения в чат ${chatId}`);

      const accessToken = await this.getAccessToken(clientId, clientSecret);
      // Для Avito API нужно использовать только цифры в profileId
      const cleanProfileId = profileId.replace(/\D/g, "");
      console.log(
        `[Avito] Оригинальный profileId: ${profileId}, очищенный: ${cleanProfileId}`
      );
      const url = `${AVITO_API_BASE_URL}/messenger/v1/accounts/${cleanProfileId}/chats/${chatId}/messages`;
      console.log(`[Avito] Отправка запроса на отправку сообщения: ${url}`);

      const payload: any = {
        message: {
          text: message,
        },
        type: "text",
      };

      if (attachment) {
        // В будущем можно добавить поддержку вложений
        console.log(`[Avito] Вложения пока не поддерживаются: ${attachment}`);
      }

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.data) {
        console.error("[Avito] API вернул пустой ответ при отправке сообщения");
        throw new Error("Ошибка отправки сообщения - пустой ответ");
      }

      // Логируем ответ для отладки
      console.log("[Avito] Ответ API при отправке сообщения:", response.data);

      // Используем message_id или id в зависимости от того, что вернул API
      // Для API v3 просто используем поле id
      const messageId =
        response.data.message_id || response.data.id || "unknown";
      console.log(`[Avito] Сообщение успешно отправлено, ID: ${messageId}`);

      return { message_id: messageId };
    } catch (error) {
      console.error(`[Avito] Error sending message to chat ${chatId}:`, error);
      throw error;
    }
  }

  /**
   * Маркирует сообщения в чате как прочитанные
   * @param channel Канал Avito
   * @param chatId ID чата
   * @returns Результат операции
   */
  async markMessagesAsRead(
    channel: Channel,
    chatId: string | number
  ): Promise<boolean> {
    const { clientId, clientSecret, profileId } = channel.settings as {
      clientId: string;
      clientSecret: string;
      profileId: string;
    };

    if (!clientId || !clientSecret || !profileId) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret или profileId)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(
        `[Avito] Маркировка сообщений как прочитанных в чате ${chatId}`
      );

      const accessToken = await this.getAccessToken(clientId, clientSecret);
      // Для Avito API нужно использовать только цифры в profileId
      const cleanProfileId = profileId.replace(/\D/g, "");
      console.log(
        `[Avito] Оригинальный profileId: ${profileId}, очищенный: ${cleanProfileId}`
      );
      const url = `${AVITO_API_BASE_URL}/messenger/v1/accounts/${cleanProfileId}/chats/${chatId}/read`;
      console.log(`[Avito] Отправка запроса на маркировку прочитанных: ${url}`);

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(
        `[Avito] Сообщения успешно отмечены как прочитанные в чате ${chatId}`
      );

      return true;
    } catch (error) {
      console.error(
        `[Avito] Error marking messages as read in chat ${chatId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Получает количество непрочитанных сообщений
   * @param channel Канал Avito
   * @returns Количество непрочитанных сообщений
   */
  async getUnreadCount(channel: Channel): Promise<number> {
    const { clientId, clientSecret, profileId } = channel.settings as {
      clientId: string;
      clientSecret: string;
      profileId: string;
    };

    if (!clientId || !clientSecret || !profileId) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret или profileId)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Получение количества непрочитанных сообщений`);

      const accessToken = await this.getAccessToken(clientId, clientSecret);
      // Для Avito API нужно использовать только цифры в profileId
      const cleanProfileId = profileId.replace(/\D/g, "");
      console.log(
        `[Avito] Оригинальный profileId: ${profileId}, очищенный: ${cleanProfileId}`
      );
      const url = `${AVITO_API_BASE_URL}/messenger/v2/accounts/${cleanProfileId}/chats?unread_only=true`;
      console.log(`[Avito] Запрос непрочитанных сообщений: ${url}`);

      const response = await axios.get(url, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      const unreadCount = response.data.chats?.length ?? 0;
      console.log(`[Avito] Количество непрочитанных сообщений: ${unreadCount}`);

      return unreadCount;
    } catch (error) {
      console.error(`[Avito] Error getting unread count:`, error);
      throw error;
    }
  }

  /**
   * Получает список подписок на вебхуки
   * @param channel Канал Avito
   * @returns Список подписок на вебхуки
   */
  async getWebhookSubscriptions(
    channel: Channel
  ): Promise<AvitoWebhookSubscription[]> {
    const { clientId, clientSecret } = channel.settings as {
      clientId: string;
      clientSecret: string;
    };

    if (!clientId || !clientSecret) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Получение списка подписок на вебхуки`);

      const accessToken = await this.getAccessToken(clientId, clientSecret);
      const url = `${AVITO_API_BASE_URL}/messenger/v1/subscriptions`;

      // API Avito использует POST для получения списка подписок
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      const subscriptions = response.data?.subscriptions || [];
      console.log(
        `[Avito] Получено ${subscriptions.length} подписок на вебхуки`
      );

      // Преобразуем в формат, совместимый с нашим интерфейсом
      return subscriptions.map((sub: any, index: number) => ({
        id: index + 1, // В API Avito нет явных ID для подписок, используем индекс
        url: sub.url,
        title: "Вебхук Avito",
        version: sub.version,
      }));
    } catch (error) {
      console.error(`[Avito] Error getting webhook subscriptions:`, error);
      // Возвращаем пустой массив вместо ошибки для более надежной работы UI
      return [];
    }
  }

  /**
   * Создает подписку на вебхук
   * @param channel Канал Avito
   * @param callbackUrl URL для вебхука
   * @param title Название вебхука (опционально)
   * @returns Результат создания подписки
   */
  async createWebhookSubscription(
    channel: Channel,
    callbackUrl: string,
    title?: string
  ): Promise<any> {
    const { clientId, clientSecret } = channel.settings as {
      clientId: string;
      clientSecret: string;
    };

    if (!clientId || !clientSecret) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Создание подписки на вебхук: ${callbackUrl}`);

      // Используем прямой метод для создания вебхука
      const result = await this.subscribeWebhook(
        clientId,
        clientSecret,
        callbackUrl
      );

      console.log(`[Avito] Подписка на вебхук успешно создана`);

      return {
        webhookId: 1, // Используем фиктивный ID, так как API Avito не возвращает ID подписки
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[Avito] Error creating webhook subscription:`, error);
      throw error;
    }
  }

  /**
   * Удаляет подписку на вебхук
   * @param channel Канал Avito
   * @param webhookId ID вебхука
   * @returns Результат удаления подписки
   */
  async deleteWebhookSubscription(
    channel: Channel,
    webhookId: number
  ): Promise<any> {
    const { clientId, clientSecret } = channel.settings as {
      clientId: string;
      clientSecret: string;
    };

    if (!clientId || !clientSecret) {
      console.error(
        "[Avito] Отсутствуют необходимые настройки канала (clientId, clientSecret)"
      );
      throw new Error("Отсутствуют необходимые настройки канала");
    }

    try {
      console.log(`[Avito] Удаление подписки на вебхук ID: ${webhookId}`);

      // Получаем текущие подписки для определения URL
      const subscriptions = await this.getWebhookSubscriptions(channel);
      const subscription = subscriptions.find((s) => s.id === webhookId);

      if (!subscription) {
        console.log(`[Avito] Подписка с ID ${webhookId} не найдена`);
        return { success: true };
      }

      // Используем метод отписки от вебхука
      await this.unsubscribeWebhook(clientId, clientSecret, subscription.url);

      console.log(`[Avito] Подписка на вебхук успешно удалена`);

      return { success: true };
    } catch (error) {
      console.error(`[Avito] Error deleting webhook subscription:`, error);
      throw error;
    }
  }

  /**
   * Создает подписку на вебхук используя API v3
   * @param clientId ID клиента Avito
   * @param clientSecret Секрет клиента Avito
   * @param callbackUrl URL для вебхука
   * @returns Результат создания подписки
   */
  async subscribeWebhook(
    clientId: string,
    clientSecret: string,
    callbackUrl: string
  ): Promise<any> {
    try {
      console.log(`[Avito] Создание подписки на вебхук v3: ${callbackUrl}`);

      // Получаем токен авторизации
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Создаем новый вебхук через API v3
      const url = `${AVITO_API_BASE_URL}/messenger/v3/webhook`;
      const payload = { url: callbackUrl };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      console.log(`[Avito] Вебхук успешно создан:`, response.data);

      return response.data;
    } catch (error) {
      console.error(`[Avito] Error subscribing to webhook:`, error);
      throw error;
    }
  }

  /**
   * Отписывается от вебхука
   * @param clientId ID клиента Avito
   * @param clientSecret Секрет клиента Avito
   * @param callbackUrl URL вебхука для отписки
   * @returns Результат отписки
   */
  async unsubscribeWebhook(
    clientId: string,
    clientSecret: string,
    callbackUrl: string
  ): Promise<any> {
    try {
      console.log(`[Avito] Отписка от вебхука: ${callbackUrl}`);

      // Получаем токен авторизации
      const accessToken = await this.getAccessToken(clientId, clientSecret);

      // Отписываемся от вебхука через API
      const url = `${AVITO_API_BASE_URL}/messenger/v1/webhook/unsubscribe`;
      const payload = { url: callbackUrl };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
        },
      });

      console.log(`[Avito] Успешно отписались от вебхука`);

      return response.data;
    } catch (error) {
      console.error(`[Avito] Error unsubscribing from webhook:`, error);
      throw error;
    }
  }

  async getName(clientId: number) {}
}

// Создаем экземпляр Avito сервиса
export const avitoService = new AvitoService();
