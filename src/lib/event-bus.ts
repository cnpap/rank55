import mitt from 'mitt';

// 定义事件类型
export interface EventMap {
  // 页面切换事件
  'page:change': string;
  // 添加索引签名以满足 mitt 的约束
  [key: string]: any;
  [key: symbol]: any;
}

// 创建事件总线实例
export const eventBus = mitt<EventMap>();
