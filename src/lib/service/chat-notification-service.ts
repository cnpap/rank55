import { LCUClientInterface } from '../client/interface';
import { BaseService } from './base-service';

export class ChatNotificationService extends BaseService {
  constructor(client?: LCUClientInterface) {
    super(client);
  }

  // 发送聊天消息到当前对话
  async sendChatMessage(message: string): Promise<void> {
    // 获取当前活跃的聊天对话ID
    const conversations = await this.getConversations();
    const activeConversation = conversations.find(
      conv => conv.type === 'championSelect'
    );

    if (activeConversation) {
      await this.makeRequest(
        'POST',
        `/lol-chat/v1/conversations/${activeConversation.id}/messages`,
        {
          body: {
            body: message,
            type: 'chat',
          },
        }
      );
    }
  }

  // 发送系统消息到当前对话
  async sendSystemMessage(message: string): Promise<void> {
    console.log(`发送系统消息: ${message}`);
    // 获取当前活跃的聊天对话ID
    const conversations = await this.getConversations();
    const activeConversation = conversations.find(
      conv => conv.type === 'championSelect'
    );

    if (activeConversation) {
      await this.makeRequest(
        'POST',
        `/lol-chat/v1/conversations/${activeConversation.id}/messages`,
        {
          body: {
            body: `[rank55] ${message}`,
            type: 'celebration',
          },
        }
      );
    }
  }

  // 获取聊天对话列表
  async getConversations(): Promise<any[]> {
    return this.makeRequest('GET', '/lol-chat/v1/conversations');
  }
}
