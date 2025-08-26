<template>
  <div v-if="userStore.isLoggedIn">
    <MatchHistory />
  </div>
</template>

<script setup lang="ts">
import MatchHistory from '@/components/MatchHistory.vue';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import { watch } from 'vue';

const userStore = useClientUserStore();
const matchHistoryStore = useMatchHistoryStore();

watch(
  () => userStore.serverId,
  async newServerId => {
    if (userStore.user) {
      await matchHistoryStore.searchSummonerByName(
        `${userStore.user.gameName}#${userStore.user.tagLine}`,
        newServerId
      );
    }
  }
);
</script>
