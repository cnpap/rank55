<script setup lang="ts">
import ChampionAnalyzer from '@/components/ChampionAnalyzer.vue';
</script>

<template>
  <main class="mx-auto max-w-7xl flex-1 px-6 py-8">
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="text-center">
        <h1 class="text-foreground mb-2 text-3xl font-bold">英雄选择</h1>
        <p class="text-muted-foreground">智能英雄推荐、技能分析和出装建议</p>
      </div>

      <!-- 英雄分析组件 -->
      <ChampionAnalyzer />
    </div>
  </main>
</template>
