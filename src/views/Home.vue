<template>
  <div v-if="userStore.isLoggedIn && gameState.isConnected.value">
    <MatchHistory />
  </div>
</template>

<script setup lang="ts">
import MatchHistory from '@/components/MatchHistory.vue';
// import ConnectionRequired from '@/components/ui/ConnectionRequired.vue';
import { useGameState } from '@/lib/composables/useGameState';
import { useClientUserStore } from '@/stores/client-user';
import { useMatchHistoryStore } from '@/stores/match-history';
import { watch } from 'vue';

const userStore = useClientUserStore();
const matchHistoryStore = useMatchHistoryStore();
const gameState = useGameState();

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
