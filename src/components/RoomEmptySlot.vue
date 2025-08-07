<script setup lang="ts">
interface Props {
  slotIndex: number;
}

defineProps<Props>();
</script>

<template>
  <div class="relative flex h-full flex-col overflow-hidden">
    <!-- 粒子星空装饰 -->
    <div class="absolute inset-0">
      <!-- 大粒子 - 稀疏分布 -->
      <div
        class="absolute top-[15%] left-[20%] h-1 w-1 rounded-full bg-blue-400/35 blur-[0.5px] dark:bg-slate-400/25"
      ></div>
      <div
        class="absolute top-[25%] right-[30%] h-1.5 w-1.5 rounded-full bg-blue-300/30 blur-[0.5px] dark:bg-slate-300/20"
      ></div>
      <div
        class="absolute top-[45%] left-[15%] h-1 w-1 rounded-full bg-blue-500/25 blur-[0.5px] dark:bg-slate-500/18"
      ></div>
      <div
        class="absolute top-[65%] right-[25%] h-1.5 w-1.5 rounded-full bg-blue-200/35 blur-[0.5px] dark:bg-slate-200/22"
      ></div>
      <div
        class="absolute bottom-[20%] left-[35%] h-1 w-1 rounded-full bg-blue-400/30 blur-[0.5px] dark:bg-slate-400/20"
      ></div>
      <div
        class="absolute right-[15%] bottom-[35%] h-1.5 w-1.5 rounded-full bg-blue-300/25 blur-[0.5px] dark:bg-slate-300/18"
      ></div>

      <!-- 中粒子 - 适中分布 -->
      <div
        class="absolute top-[30%] left-[45%] h-0.5 w-0.5 rounded-full bg-blue-400/40 dark:bg-slate-400/25"
      ></div>
      <div
        class="absolute top-[50%] right-[40%] h-0.5 w-0.5 rounded-full bg-blue-300/35 dark:bg-slate-300/22"
      ></div>
      <div
        class="absolute top-[70%] left-[60%] h-0.5 w-0.5 rounded-full bg-blue-500/30 dark:bg-slate-500/20"
      ></div>
      <div
        class="absolute bottom-[40%] left-[25%] h-0.5 w-0.5 rounded-full bg-blue-200/40 dark:bg-slate-200/25"
      ></div>
      <div
        class="absolute right-[55%] bottom-[60%] h-0.5 w-0.5 rounded-full bg-blue-400/35 dark:bg-slate-400/22"
      ></div>

      <!-- 小粒子 - 密集分布 -->
      <div
        class="absolute top-[20%] left-[55%] h-px w-px rounded-full bg-blue-400/50 dark:bg-slate-400/30"
      ></div>
      <div
        class="absolute top-[35%] right-[20%] h-px w-px rounded-full bg-blue-300/45 dark:bg-slate-300/28"
      ></div>
      <div
        class="absolute top-[55%] left-[40%] h-px w-px rounded-full bg-blue-500/40 dark:bg-slate-500/25"
      ></div>
      <div
        class="absolute top-[75%] right-[45%] h-px w-px rounded-full bg-blue-200/50 dark:bg-slate-200/30"
      ></div>
      <div
        class="absolute bottom-[25%] left-[65%] h-px w-px rounded-full bg-blue-400/45 dark:bg-slate-400/28"
      ></div>
      <div
        class="absolute right-[35%] bottom-[45%] h-px w-px rounded-full bg-blue-300/40 dark:bg-slate-300/25"
      ></div>
      <div
        class="absolute bottom-[65%] left-[50%] h-px w-px rounded-full bg-blue-500/50 dark:bg-slate-500/30"
      ></div>

      <!-- 连接线 - 模拟星座连线 -->
      <div
        class="absolute top-[25%] left-[20%] h-px w-8 rotate-12 transform bg-gradient-to-r from-blue-400/15 to-transparent dark:from-slate-400/10 dark:to-transparent"
      ></div>
      <div
        class="absolute top-[45%] right-[30%] h-px w-6 -rotate-20 transform bg-gradient-to-l from-blue-300/12 to-transparent dark:from-slate-300/8 dark:to-transparent"
      ></div>
      <div
        class="absolute bottom-[35%] left-[35%] h-px w-10 rotate-30 transform bg-gradient-to-r from-blue-500/15 to-transparent dark:from-slate-500/10 dark:to-transparent"
      ></div>

      <!-- 微光效果 -->
      <div
        class="absolute top-[40%] left-[30%] h-4 w-4 rounded-full bg-blue-400/6 blur-md dark:bg-slate-400/4"
      ></div>
      <div
        class="absolute right-[40%] bottom-[50%] h-6 w-6 rounded-full bg-blue-300/4 blur-lg dark:bg-slate-300/3"
      ></div>
      <div
        class="absolute top-[60%] right-[60%] h-3 w-3 rounded-full bg-blue-500/8 blur-sm dark:bg-slate-500/5"
      ></div>
    </div>

    <!-- 空位内容区域 -->
    <div class="relative z-10 flex flex-1 items-center justify-center">
      <div class="text-center">
        <!-- 主题感知的位置图标 -->
        <div
          class="from-card/80 to-card/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/25 bg-gradient-to-br shadow-lg shadow-blue-500/8 backdrop-blur-sm dark:border-slate-200/15 dark:shadow-slate-500/5"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-blue-400/30 dark:border-slate-400/20"
          >
            <div
              class="h-2 w-2 rounded-full bg-blue-500/25 dark:bg-slate-500/15"
            ></div>
          </div>
        </div>
        <!-- 位置信息 -->
        <p
          class="text-muted-foreground/90 mb-1 text-sm font-medium tracking-wide"
        >
          位置 {{ slotIndex + 1 }}
        </p>
        <p class="text-muted-foreground/65 text-xs">等待队友</p>
      </div>
    </div>
  </div>
</template>
