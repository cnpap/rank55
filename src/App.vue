<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { getLayoutComponent } from '@/router';
import { eventBus } from '@/lib/event-bus';
import { watch } from 'vue';

const route = useRoute();

// 根据当前路由获取对应的布局组件
const currentLayout = computed(() => {
  const layoutName = route.meta?.layout || 'main';
  return getLayoutComponent(layoutName as string);
});

// 监听页面切换
watch(
  () => route.name,
  newRouteName => {
    if (newRouteName) {
      eventBus.emit('page:change', newRouteName as string);
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- 动态布局组件 -->
  <component :is="currentLayout">
    <!-- 路由视图 with keep-alive -->
    <router-view v-slot="{ Component, route }">
      <keep-alive>
        <component
          :is="Component"
          :key="
            route.meta?.keepAlive
              ? route.name === 'Home'
                ? route.fullPath
                : route.name
              : route.fullPath
          "
          v-if="route.meta?.keepAlive"
        />
      </keep-alive>
      <component
        :is="Component"
        :key="route.fullPath"
        v-if="!route.meta?.keepAlive"
      />
    </router-view>
  </component>
</template>

<style scoped>
/* App.vue 现在只负责动态布局切换，具体样式由各布局组件处理 */
</style>
