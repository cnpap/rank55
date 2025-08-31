export interface NavigationItem {
  name: string;
  path: string;
  title: string;
  icon?: string;
}

export const navigationItems: NavigationItem[] = [
  {
    name: 'Home',
    path: '/',
    title: '战绩',
    icon: '📊',
  },
  // {
  //   name: 'Equipment',
  //   path: '/equipment',
  //   title: '装备分析',
  //   icon: '⚔️',
  // },
  // {
  //   name: 'Champion',
  //   path: '/champion',
  //   title: '英雄选择',
  //   icon: '🏆',
  // },
  // {
  //   name: 'BanPick',
  //   path: '/ban-pick',
  //   title: '禁/选',
  //   icon: '🚫',
  // },
  {
    name: 'RoomManagement',
    path: '/room-management',
    title: '房间/对局',
    icon: '🏠',
  },
  // {
  //   name: 'Match',
  //   path: '/match',
  //   title: '对局',
  //   icon: '⚡',
  // },
  {
    name: 'Settings',
    path: '/settings',
    title: '设置',
    icon: '⚙️',
  },
];
