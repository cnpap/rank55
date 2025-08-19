<script setup lang="ts">
import MatchHistoryQuery from '@/components/MatchHistoryQuery.vue';
</script>

<template>
  <main class="relative flex h-[calc(100vh-40px)] flex-col">
    <!-- 主内容容器 -->
    <div class="relative z-10 mx-auto flex flex-1 flex-col p-6">
      <!-- 主内容区域 - 调整为单列布局 -->
      <div class="flex flex-1 justify-center">
        <!-- 战绩查询区域 -->
        <div class="flex w-full max-w-4xl flex-col">
          <MatchHistoryQuery />
        </div>
      </div>
    </div>
  </main>
</template>
