import mitt from 'mitt';

// 定义事件类型
export interface EventMap {
  // 应用焦点事件
  'app:focus': boolean;
  // 页面切换事件
  'page:change': string;
  // 游戏连接监控事件
  'monitoring:start': void;
  'monitoring:stop': void;
  // 房间监控事件
  'room:monitoring:start': void;
  'room:monitoring:stop': void;
  // 用户监控事件
  'user:monitoring:start': void;
  'user:monitoring:stop': void;
  // 自动接受游戏事件
  'auto-accept:enable': void;
  'auto-accept:disable': void;
  'auto-accept:accepted': void;
  'auto-accept:error': string;
  // 自动禁用英雄事件
  'auto-ban:enable': void;
  'auto-ban:disable': void;
  'auto-ban:executed': string; // 传递禁用的英雄名称
  'auto-ban:error': string;
  // 自动选择英雄事件
  'auto-pick:enable': void;
  'auto-pick:disable': void;
  'auto-pick:executed': string; // 传递选择的英雄名称
  'auto-pick:error': string;
  // 添加索引签名以满足 mitt 的约束
  [key: string]: any;
  [key: symbol]: any;
}

// 创建事件总线实例
export const eventBus = mitt<EventMap>();
