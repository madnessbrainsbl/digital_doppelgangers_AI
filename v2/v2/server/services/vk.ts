import axios from "axios";
import { Channel } from "../../shared/schema";
import { IStorage } from "../storage";
import { VkDialogDisplay } from "@/types/messages";

/**
 * Версия VK API для использования во всех запросах
 */
const VK_API_VERSION = "5.131";

/**
 * Интерфейс для VK диалога
 */
export interface VkConversation {
  id: number;
  type: string;
  lastMessageId: number;
  lastMessage: VkMessage;
  unreadCount?: number;
  canWrite?: {
    allowed: boolean;
  };
}

/**
 * Интерфейс для VK сообщения
 */
export interface VkMessage {
  id: number;
  date: number;
  peerId: number;
  fromId: number;
  text: string;
  attachments?: any[];
  conversationMessageId?: number;
}

/**
 * Интерфейс для подписки на вебхук VK
 */
export interface VkWebhookSubscription {
  id: number;
  url: string;
  title: string;
}

/**
 * Сервис для работы с API VK
 */
export class VkService {
  /**
   * Получает список диалогов из VK
   */
  async getConversations(channel: Channel): Promise<VkConversation[]> {
    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/messages.getConversations`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          count: 20,
          filter: "all", // Получаем все диалоги, включая непрочитанные
          extended: 1, // Получаем расширенную информацию
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg || "Ошибка при получении диалогов VK"
        );
      }

      return (
        response.data.response?.items.map((item: any) => {
          return {
            id: item.conversation.peer.id,
            type: item.conversation.peer.type,
            lastMessageId: item.conversation.last_message_id,
            lastMessage: {
              id: item.last_message.id,
              date: item.last_message.date,
              peerId: item.last_message.peer_id,
              fromId: item.last_message.from_id,
              text: item.last_message.text,
              attachments: item.last_message.attachments,
              conversationMessageId: item.last_message.conversation_message_id,
            },
            unreadCount: item.conversation.unread_count,
            canWrite: item.conversation.can_write,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error getting VK conversations:", error);
      return [];
    }
  }

  /**
   * Алиас для получения диалогов из VK, для совместимости с новым кодом
   *
   * @param channel Канал VK
   * @returns Список диалогов
   */
  async getDialogs(channel: Channel): Promise<VkConversation[]> {
    return this.getConversations(channel);
  }

  /**
   * Получает историю сообщений диалога VK
   */
  async getConversationHistory(
    channel: Channel,
    peerId: number,
    count: number = 50
  ): Promise<VkMessage[]> {
    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/messages.getHistory`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          peer_id: peerId,
          count: count,
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при получении истории диалога VK"
        );
      }

      return (
        response.data.response?.items.map((msg: any) => {
          return {
            id: msg.id,
            date: msg.date,
            peerId: msg.peer_id,
            fromId: msg.from_id,
            text: msg.text,
            attachments: msg.attachments,
            conversationMessageId: msg.conversation_message_id,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error getting VK conversation history:", error);
      return [];
    }
  }

  /**
   * Получает информацию о пользователе VK
   */
  async getUserInfo(channel: Channel, userId: number): Promise<any> {
    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/users.get`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          user_ids: userId,
          fields: "photo_100",
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при получении информации о пользователе VK"
        );
      }

      return response.data.response?.length > 0
        ? response.data.response[0]
        : null;
    } catch (error) {
      console.error("Error getting VK user info:", error);
      return null;
    }
  }

  /**
   * Получает информацию о нескольких пользователях VK
   */
  async getUsersInfo(channel: Channel, userIds: number[]): Promise<any[]> {
    if (!userIds.length) return [];

    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/users.get`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          user_ids: userIds.join(","),
          fields: "photo_100",
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при получении информации о пользователях VK"
        );
      }

      return response.data.response || [];
    } catch (error) {
      console.error("Error getting VK users info:", error);
      return [];
    }
  }

  /**
   * Отправляет сообщение в диалог VK
   */
  async sendMessage(
    channel: Channel,
    peerId: number,
    message: string,
    attachment?: string
  ): Promise<{ message_id: number }> {
    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/messages.send`;
      const params: any = {
        access_token: token,
        peer_id: peerId,
        message: message,
        random_id: Math.floor(Math.random() * 1000000000),
        v: VK_API_VERSION,
      };

      if (attachment) {
        params.attachment = attachment;
      }

      const response = await axios.post(url, null, { params });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg || "Ошибка при отправке сообщения VK"
        );
      }

      const messageId = response.data.response;

      // VK API возвращает просто число (ID сообщения), преобразуем в объект
      return { message_id: messageId };
    } catch (error) {
      console.error("Error sending VK message:", error);
      throw error;
    }
  }

  /**
   * Маркирует сообщения в диалоге как прочитанные
   * @see https://dev.vk.com/method/messages.markAsRead
   */
  async markMessagesAsRead(channel: Channel, peerId: number): Promise<boolean> {
    const { token } = channel.settings as { token: string; groupId: string };

    try {
      const url = `https://api.vk.com/method/messages.markAsRead`;
      const params: any = {
        access_token: token,
        peer_id: peerId,
        mark_conversation_as_read: 1, // Помечает всю беседу как прочитанную
        v: VK_API_VERSION,
      };

      const response = await axios.post(url, null, { params });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при маркировке сообщений как прочитанных"
        );
      }

      // VK API возвращает 1, если операция успешна
      return response.data.response === 1;
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  /**
   * Получает список подписок на вебхуки
   */
  async getWebhookSubscriptions(
    channel: Channel
  ): Promise<VkWebhookSubscription[]> {
    const { token, groupId } = channel.settings as {
      token: string;
      groupId: string;
    };

    try {
      const url = `https://api.vk.com/method/groups.getCallbackServers`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          group_id: groupId,
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при получении списка вебхуков VK"
        );
      }

      return (
        response.data.response?.items.map((item: any) => {
          return {
            id: item.id,
            url: item.url,
            title: item.title,
          };
        }) || []
      );
    } catch (error) {
      console.error("Error getting VK webhook subscriptions:", error);
      return [];
    }
  }

  /**
   * Создает подписку на вебхук
   */
  async createWebhookSubscription(
    channel: Channel,
    callbackUrl: string,
    title: string = "Asissto Bot"
  ): Promise<any> {
    const { token, groupId } = channel.settings as {
      token: string;
      groupId: string;
    };

    try {
      console.log(`[VK] Создаем вебхук для URL: ${callbackUrl}`);

      // Предварительно удаляем все существующие вебхуки, чтобы не было конфликтов
      try {
        const existingWebhooks = await this.getWebhookSubscriptions(channel);
        if (existingWebhooks.length > 0) {
          console.log(
            `[VK] Найдено ${existingWebhooks.length} существующих вебхуков, удаляем их перед созданием нового`
          );

          for (const webhook of existingWebhooks) {
            try {
              console.log(
                `[VK] Удаляем существующий вебхук: ${webhook.title} (${webhook.url})`
              );
              await this.deleteWebhookSubscription(channel, webhook.id);
            } catch (deleteError) {
              console.warn(
                `[VK] Не удалось удалить существующий вебхук ${webhook.id}:`,
                deleteError
              );
              // Продолжаем выполнение, даже если не удалось удалить старый вебхук
            }
          }
        }
      } catch (error) {
        console.warn("[VK] Ошибка при получении существующих вебхуков:", error);
        // Продолжаем создание вебхука, даже если не удалось получить список существующих
      }

      // Шаг 1: Добавить сервер для коллбэков
      const addServerUrl = `https://api.vk.com/method/groups.addCallbackServer`;
      const addServerResponse = await axios.post(addServerUrl, null, {
        params: {
          access_token: token,
          group_id: groupId,
          url: callbackUrl,
          title: title,
          v: VK_API_VERSION,
        },
      });

      if (addServerResponse.data.error) {
        console.error("[VK] API error:", addServerResponse.data.error);
        throw new Error(
          addServerResponse.data.error.error_msg ||
            "Ошибка при создании вебхука VK"
        );
      }

      const serverId = addServerResponse.data.response.server_id;
      console.log(`[VK] Вебхук успешно создан с ID ${serverId}`);

      // Шаг 2: Настроить параметры вебхука
      const setSettingsUrl = `https://api.vk.com/method/groups.setCallbackSettings`;
      const setSettingsResponse = await axios.post(setSettingsUrl, null, {
        params: {
          access_token: token,
          group_id: groupId,
          server_id: serverId,
          message_new: 1, // Подписка на новые сообщения
          v: VK_API_VERSION,
        },
      });

      if (setSettingsResponse.data.error) {
        console.error(
          "[VK] API error при настройке параметров вебхука:",
          setSettingsResponse.data.error
        );

        // В случае ошибки при настройке параметров, попробуем удалить созданный вебхук
        try {
          await this.deleteWebhookSubscription(channel, serverId);
          console.log(
            `[VK] Удален вебхук ${serverId} после ошибки при настройке параметров`
          );
        } catch (deleteError) {
          console.warn(
            `[VK] Не удалось удалить вебхук ${serverId} после ошибки:`,
            deleteError
          );
        }

        throw new Error(
          setSettingsResponse.data.error.error_msg ||
            "Ошибка при настройке вебхука VK"
        );
      }

      console.log(`[VK] Параметры вебхука ID ${serverId} успешно настроены`);
      return {
        serverId,
        success: true,
      };
    } catch (error) {
      console.error("[VK] Error creating webhook subscription:", error);
      throw error;
    }
  }

  /**
   * Удаляет подписку на вебхук
   */
  async deleteWebhookSubscription(
    channel: Channel,
    serverId: number
  ): Promise<any> {
    const { token, groupId } = channel.settings as {
      token: string;
      groupId: string;
    };

    try {
      // Сначала получаем информацию о подписке, чтобы убедиться, что она существует
      try {
        const webhooks = await this.getWebhookSubscriptions(channel);
        const webhook = webhooks.find((wh) => wh.id === serverId);

        if (!webhook) {
          console.log(
            `[VK] Вебхук с ID ${serverId} не найден, возможно уже удален`
          );
          return { success: true };
        }

        console.log(
          `[VK] Удаляем вебхук ${webhook.title} (${webhook.url}) с ID ${serverId}`
        );
      } catch (error) {
        console.warn(
          `[VK] Ошибка при получении информации о вебхуке ${serverId}:`,
          error
        );
        // Продолжаем попытку удаления, даже если не смогли получить информацию
      }

      // Удаляем вебхук из VK API
      const url = `https://api.vk.com/method/groups.deleteCallbackServer`;
      const response = await axios.post(url, null, {
        params: {
          access_token: token,
          group_id: groupId,
          server_id: serverId,
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        // Если ошибка связана с тем, что сервер не найден (уже удален), не считаем это ошибкой
        if (
          response.data.error.error_code === 100 &&
          response.data.error.error_msg.includes("server_id")
        ) {
          console.log(`[VK] Вебхук с ID ${serverId} не найден в API VK`);
          return { success: true };
        }

        console.error("[VK] API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg || "Ошибка при удалении вебхука VK"
        );
      }

      console.log(`[VK] Вебхук с ID ${serverId} успешно удален из VK API`);
      return {
        success: true,
      };
    } catch (error) {
      console.error("[VK] Error deleting webhook subscription:", error);
      throw error;
    }
  }

  /**
   * Получает код подтверждения для вебхука
   */
  async getConfirmationCode(channel: Channel): Promise<string> {
    const { token, groupId } = channel.settings as {
      token: string;
      groupId: string;
    };

    try {
      const url = `https://api.vk.com/method/groups.getCallbackConfirmationCode`;
      const response = await axios.get(url, {
        params: {
          access_token: token,
          group_id: groupId,
          v: VK_API_VERSION,
        },
      });

      if (response.data.error) {
        console.error("VK API error:", response.data.error);
        throw new Error(
          response.data.error.error_msg ||
            "Ошибка при получении кода подтверждения VK"
        );
      }

      return response.data.response.code;
    } catch (error) {
      console.error("Error getting VK confirmation code:", error);
      throw error;
    }
  }
}

// Создаем экземпляр VK сервиса
export const vkService = new VkService();
