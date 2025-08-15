import axios from 'axios';

interface UserData {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    referralCode?: string;
}

export class TelegramService {
    private readonly botToken: string;
    private readonly chatId: string;
    private readonly apiUrl: string;

    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.chatId = process.env.TELEGRAM_CHAT_ID || '';
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async testConnection(token?: string, botUsername?: string): Promise<boolean> {
        try {
            const testToken = token || this.botToken;
            const url = `https://api.telegram.org/bot${testToken}/getMe`;
            const response = await axios.get(url);
            
            if (botUsername && response.data?.result?.username !== botUsername) {
                return false;
            }
            
            return response.data?.ok === true;
        } catch (error) {
            console.error('Failed to test Telegram connection:', error);
            return false;
        }
    }

    async sendNewUserNotification(userData: UserData, customChatId?: string, customToken?: string): Promise<boolean> {
        try {
            const message = this.constructNewUserMessage(userData);
            await this.sendMessage(message, customChatId, customToken);
            console.info(`Telegram notification sent for user ${userData.id || userData.name}`);
            return true;
        } catch (error) {
            console.error('Failed to send Telegram notification:', error);
            return false;
        }
    }

    private constructNewUserMessage(userData: UserData): string {
        const parts = [
            '🎉 New User Registration!',
            `\n👤 Name: ${userData.name}`
        ];

        if (userData.id) {
            parts.push(`🆔 ID: ${userData.id}`);
        }

        if (userData.email) {
            parts.push(`📧 Email: ${userData.email}`);
        }

        if (userData.phone) {
            parts.push(`📱 Phone: ${userData.phone}`);
        }

        if (userData.referralCode) {
            parts.push(`🔗 Referral Code: ${userData.referralCode}`);
        }

        parts.push(`\n📅 Date: ${new Date().toLocaleString()}`);

        return parts.join('\n');
    }

    private async sendMessage(text: string, customChatId?: string, customToken?: string): Promise<void> {
        const token = customToken || this.botToken;
        const chatId = customChatId || this.chatId;
        const url = `https://api.telegram.org/bot${token}/sendMessage`;

        if (!token || !chatId) {
            throw new Error('Telegram bot token or chat ID not configured');
        }

        await axios.post(url, {
            chat_id: chatId,
            text,
            parse_mode: 'HTML'
        });
    }
}

export const telegramService = new TelegramService(); 