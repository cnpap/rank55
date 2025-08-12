import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// 页面组件
import Home from '@/views/Home.vue';
import Equipment from '@/views/Equipment.vue';
import Champion from '@/views/Champion.vue';
import BanPick from '@/views/BanPick.vue';
import Match from '@/views/Match.vue';
import RoomManagement from '@/views/RoomManagement.vue';
import Settings from '@/views/Settings.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '战绩查询',
      icon: '📊',
      keepAlive: true,
    },
  },
  {
    path: '/equipment',
    name: 'Equipment',
    component: Equipment,
    meta: {
      title: '装备分析',
      icon: '⚔️',
      keepAlive: true,
    },
  },
  {
    path: '/champion',
    name: 'Champion',
    component: Champion,
    meta: {
      title: '英雄选择',
      icon: '🏆',
      keepAlive: true,
    },
  },
  {
    path: '/ban-pick',
    name: 'BanPick',
    component: BanPick,
    meta: {
      title: '禁/选',
      icon: '🚫',
      keepAlive: true,
    },
  },
  {
    path: '/match',
    name: 'Match',
    component: Match,
    meta: {
      title: '对局',
      icon: '⚡',
      keepAlive: true,
    },
  },
  {
    path: '/room-management',
    name: 'RoomManagement',
    component: RoomManagement,
    meta: {
      title: '房间管理',
      icon: '🏠',
      keepAlive: true,
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置',
      icon: '⚙️',
      keepAlive: true,
    },
  },
];

// 检测是否在Electron环境中
const isElectron =
  !!(window as any).electronAPI ||
  navigator.userAgent.toLowerCase().includes('electron');

const router = createRouter({
  // 在Electron环境中使用hash模式，在浏览器中使用history模式
  history: isElectron ? createWebHashHistory() : createWebHistory(),
  routes,
});

// 路由守卫 - 设置页面标题
router.beforeEach(to => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - LOL 助手`;
  }
});

export default router;
