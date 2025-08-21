<template>
  <div v-if="userStore.isLoggedIn">
    <MatchHistory />
  </div>
</template>

<script setup lang="ts">
import MatchHistory from '@/components/MatchHistory.vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
</script>
