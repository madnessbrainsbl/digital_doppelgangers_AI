import axios from 'axios';

interface UserData {
  name: string;
  email: string;
  phone: string;
}

export const telegramService = {
  async sendNewUserNotification(userData: UserData, chatId: string, botToken: string): Promise<void> {
    const message = `🎉 Новый пользователь!\n\n👤 Имя: ${userData.name}\n📧 Email: ${userData.email}\n📱 Телефон: ${userData.phone}`;
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
      throw error;
    }
  }
}; 