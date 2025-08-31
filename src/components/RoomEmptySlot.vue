<script setup lang="ts">
interface Props {
  slotIndex: number;
}

defineProps<Props>();
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden">
    <!-- 空位内容区域 -->
    <div class="relative z-10 flex flex-1 items-center justify-center">
      <div class="text-center">
        <!-- 主题感知的位置图标 -->
        <div
          class="from-card/80 to-card/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/25 bg-gradient-to-br shadow-lg shadow-blue-500/8 backdrop-blur-sm dark:border-slate-200/10 dark:shadow-slate-500/5"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-blue-400/30 dark:border-slate-400/20"
          >
            <div
              class="h-2 w-2 rounded-full bg-blue-500/25 dark:bg-[#121212]/15"
            ></div>
          </div>
        </div>
        <!-- 位置信息 -->
        <div>
          <p
            class="text-muted-foreground/90 mb-1 text-sm font-medium tracking-wide"
          >
            位置 {{ slotIndex + 1 }}
          </p>
          <p class="text-muted-foreground/65 text-xs">等待队友</p>
        </div>
      </div>
    </div>
  </div>
</template>
