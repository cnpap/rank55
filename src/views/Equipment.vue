<script setup lang="ts">
import ItemAnalyzer from '@/components/ItemAnalyzer.vue';
</script>

<template>
  <main class="mx-auto max-w-7xl flex-1 px-6 py-8">
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="text-center">
        <h1 class="text-foreground mb-2 text-3xl font-bold">装备分析</h1>
        <p class="text-muted-foreground">
          深度分析装备属性、合成路径和效率优化
        </p>
      </div>

      <!-- 装备分析组件 -->
      <ItemAnalyzer />
    </div>
  </main>
</template>
