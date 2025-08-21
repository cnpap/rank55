<template>
  <div v-if="userStore.isLoggedIn">
    <MatchHistory v-if="route.query.puuid" />
    <div v-else class="flex h-[calc(100vh-40px)] items-center justify-center">
      <div class="text-center">
        <p class="text-muted-foreground">请先搜索召唤师查看战绩</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MatchHistory from '@/components/MatchHistory.vue';
import { useUserStore } from '@/stores/user';
import { useRoute } from 'vue-router';

const userStore = useUserStore();
const route = useRoute();
</script>
