<template>
  <div v-if="userStore.isLoggedIn">
    <MatchHistory v-if="route.query.puuid" />
    <div
      v-else
      class="flex h-[calc(100vh-40px)] flex-col items-center justify-center"
    >
      <Loading class="mb-2 text-pink-500" size="lg" />
      <p class="text-muted-foreground">默认将显示当前召唤师的战绩 ....</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loading from '@/components/Loading.vue';
import MatchHistory from '@/components/MatchHistory.vue';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const userStore = useClientUserStore();
const route = useRoute();
const matchHistoryStore = useMatchHistoryStore();

// 监听 user 变化
onMounted(async () => {
  if (userStore.user && !route.query.puuid) {
    await matchHistoryStore.searchSummonerByName(
      `${userStore.user.gameName}#${userStore.user.tagLine}`,
      userStore.serverId
    );
  }
});
</script>
