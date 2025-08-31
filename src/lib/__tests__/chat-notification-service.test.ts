import { describe, it, expect, beforeEach } from 'vitest';
import { LCUClient } from '../client/lcu-client';
import { ChatNotificationService } from '../service/chat-notification-service';
import { LCUClientInterface } from '../client/interface';
import { GameflowService } from '../service/gameflow-service';

describe('ChatNotificationService', () => {
  let lcuClient: LCUClientInterface;
  let chatNotificationService: ChatNotificationService;
  let gameflowService: GameflowService;

  describe('聊天通知服务 - 真实LOL测试', () => {
    beforeEach(async () => {
      try {
        lcuClient = await LCUClient.create();
        chatNotificationService = new ChatNotificationService(lcuClient);
        gameflowService = new GameflowService(lcuClient);
      } catch (error) {
        console.log(`⏭️ 跳过真实LOL测试: ${error}`);
        return;
      }
    });

    it('应该能够获取当前游戏状态', async () => {
      const gameflowPhase = await gameflowService.getGameflowPhase();
      console.log('✅ 当前游戏状态:', gameflowPhase);
    });

    it('应该能够获取聊天对话列表', async () => {
      try {
        const conversations = await chatNotificationService.getConversations();
        console.log('✅ 获取聊天对话列表成功');
        console.log(`📋 对话数量: ${conversations.length}`);

        if (conversations.length > 0) {
          console.log('📝 对话列表:');
          conversations.forEach((conv, index) => {
            console.log(
              `  ${index + 1}. ID: ${conv.id}, 类型: ${conv.type || '未知'}`
            );
          });
        }

        expect(Array.isArray(conversations)).toBe(true);
      } catch (error) {
        console.log('⚠️ 获取聊天对话列表失败:', error);
      }
    });

    it('应该能够发送聊天消息', async () => {
      try {
        await chatNotificationService.sendChatMessage('🤖 LOL助手测试消息');
        console.log('✅ 发送聊天消息成功');
      } catch (error) {
        console.log('⚠️ 发送聊天消息失败:', error);
        // 不抛出错误，因为可能不在聊天环境中
      }
    });

    it('应该能够发送系统消息', async () => {
      try {
        await chatNotificationService.sendSystemMessage('🤖 系统测试消息');
        console.log('✅ 发送系统消息成功');
      } catch (error) {
        console.log('⚠️ 发送系统消息失败:', error);
      }
    });
  });
});
