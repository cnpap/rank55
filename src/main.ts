import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import './utils/theme'; // 初始化主题
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 等待路由准备就绪后再挂载应用
router.isReady().then(() => {
  app.mount('#app');
});
