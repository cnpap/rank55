<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Loading from '@/components/Loading.vue';
import { useMatchHistoryStore } from '@/stores/match-history';
import { SearchHistoryItem } from '@/storages/storage-use';
import { useClientUserStore } from '@/stores/client-user';
import { Clock, Users, Search, UserCheck } from 'lucide-vue-next';

// Props 定义
interface Props {
  // 可选的样式类名
  class?: string;
  // 是否显示搜索历史
  showHistory?: boolean;
  // 最大显示历史记录数量
  maxHistoryItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  showHistory: true,
  maxHistoryItems: 5,
});

// Emits 定义
interface Emits {
  // 搜索开始事件
  searchStart: [summonerName: string, serverId: string];
  // 搜索成功事件
  searchSuccess: [result: any];
  // 搜索失败事件
  searchError: [error: string];
}

const emit = defineEmits<Emits>();

const userStore = useClientUserStore();
const matchHistoryStore = useMatchHistoryStore();
const { sgpMatchService } = matchHistoryStore.getServices();

// 弹出框状态
const isDropdownOpen = ref(false);
const searchContainerRef = ref<HTMLDivElement>();

// 本地搜索状态
const summonerName = ref<SearchHistoryItem>({
  name: '',
  serverId: '',
  serverName: '',
  puuid: '',
});

// 模拟好友列表数据（实际项目中应该从API获取）
const mockFriends = ref([
  {
    id: '1',
    name: 'Player1#1234',
    displayName: 'Player1',
    tagLine: '1234',
    isOnline: true,
    serverId: 'kr',
    serverName: '韩服',
  },
  {
    id: '2',
    name: 'Player2#5678',
    displayName: 'Player2',
    tagLine: '5678',
    isOnline: false,
    serverId: 'na1',
    serverName: '北美',
  },
  {
    id: '3',
    name: 'Player3#9999',
    displayName: 'Player3',
    tagLine: '9999',
    isOnline: true,
    serverId: 'euw1',
    serverName: '欧西',
  },
]);

// 计算属性
const isSearching = computed(() => matchHistoryStore.isSearching);
const searchHistory = computed(() => matchHistoryStore.searchHistory);
const availableServers = computed(() => matchHistoryStore.availableServers);
const selectedServerId = computed({
  get: () => matchHistoryStore.selectedServerId,
  set: (value: string) => {
    matchHistoryStore.setSelectedServerId(value);
    // 同时更新本地搜索状态中的服务器信息
    const selectedServer = availableServers.value.find(s => s.id === value);
    if (selectedServer) {
      summonerName.value.serverId = selectedServer.id;
      summonerName.value.serverName = selectedServer.name;
    }
  },
});

// 在线好友
const onlineFriends = computed(() =>
  mockFriends.value.filter(friend => friend.isOnline)
);

// 搜索功能
const handleSearch = async () => {
  if (!summonerName.value.name.trim()) return;

  try {
    emit('searchStart', summonerName.value.name, selectedServerId.value);
    await matchHistoryStore.searchSummonerByName(summonerName.value.name);
    emit('searchSuccess', {
      name: summonerName.value.name,
      serverId: selectedServerId.value,
    });
    // 搜索成功后关闭弹出框
    isDropdownOpen.value = false;
  } catch (error: any) {
    console.error('搜索失败:', error);
    emit('searchError', error.message || '搜索失败');
  }
};

// 搜索当前登录的召唤师
const searchCurrentSummoner = async () => {
  try {
    const serverId = await sgpMatchService._inferCurrentUserServerId();
    console.log(
      `searchCurrentSummoner 输入: serverId=${serverId} fullGameName=${userStore.fullGameName}`
    );

    emit('searchStart', userStore.fullGameName, serverId!);
    await matchHistoryStore.searchSummonerByName(
      userStore.fullGameName,
      serverId!
    );
    emit('searchSuccess', { name: userStore.fullGameName, serverId });
    isDropdownOpen.value = false;
  } catch (error: any) {
    console.error('搜索当前召唤师失败:', error);
    emit('searchError', error.message || '搜索当前召唤师失败');
  }
};

// 从历史记录搜索
const searchFromHistory = async (item: SearchHistoryItem) => {
  summonerName.value = { ...item };
  // 设置对应的服务器
  selectedServerId.value = item.serverId;
  await handleSearch();
};

// 从好友列表搜索
const searchFromFriend = async (friend: any) => {
  summonerName.value = {
    name: friend.name,
    serverId: friend.serverId,
    serverName: friend.serverName,
    puuid: '',
  };
  selectedServerId.value = friend.serverId;
  await handleSearch();
};

// 处理输入框焦点
const handleInputFocus = () => {
  isDropdownOpen.value = true;
};

// 处理点击外部区域关闭弹出框
const handleClickOutside = (event: MouseEvent) => {
  if (
    searchContainerRef.value &&
    !searchContainerRef.value.contains(event.target as Node)
  ) {
    isDropdownOpen.value = false;
  }
};

// 组件挂载时添加事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 暴露方法给父组件
defineExpose({
  handleSearch,
  searchCurrentSummoner,
  searchFromHistory,
  clearInput: () => {
    summonerName.value.name = '';
  },
});
</script>

<template>
  <div :class="props.class">
    <!-- 搜索区域 -->
    <div ref="searchContainerRef" class="relative">
      <!-- 融合的搜索框 -->
      <div
        class="border-input bg-background relative flex h-8 overflow-hidden rounded-md border"
      >
        <!-- 服务器选择框 - 作为输入框的前缀 -->
        <Select v-model="selectedServerId">
          <SelectTrigger
            class="border-input bg-muted/30 -mt-1 h-8 w-28 border-0 text-xs ring-0 ring-offset-0 outline-none focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
          >
            <SelectValue placeholder="服务器" class="h-8" />
          </SelectTrigger>
          <SelectContent class="z-999999 -mt-1 -ml-[0.5px]">
            <SelectItem
              v-for="server in availableServers"
              :key="server.id"
              :value="server.id"
            >
              {{ server.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- 搜索输入框 - 无边框，与选择框融合 -->
        <div class="relative flex-1">
          <Input
            v-model="summonerName.name"
            placeholder="召唤师名称#00000..."
            class="h-8 border-0 pr-20 pl-10 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            @keyup.enter="handleSearch"
            @focus="handleInputFocus"
            :disabled="isSearching"
          />
          <!-- "我" 按钮 - 在输入框内部左侧 -->
          <Button
            @click="searchCurrentSummoner"
            :disabled="isSearching"
            class="absolute top-1/2 left-1 h-6 -translate-y-1/2 cursor-pointer px-2 text-xs"
            size="sm"
          >
            我
          </Button>
          <!-- 搜索按钮 - 在输入框内部右侧 -->
          <Button
            @click="handleSearch"
            :disabled="!summonerName.name.trim() || isSearching"
            class="absolute top-1/2 right-1 h-6 -translate-y-1/2 cursor-pointer px-2 text-xs"
            size="sm"
          >
            <span v-if="isSearching" class="flex items-center gap-1">
              <Loading size="xs" />
              搜索中
            </span>
            <span v-else>搜索</span>
          </Button>
        </div>
      </div>

      <!-- 弹出框内容 - 简化的布局 -->
      <div
        v-if="isDropdownOpen"
        class="font-tektur-numbers border-border/50 from-background/95 to-background/90 animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-0.5 w-120 border bg-gradient-to-b p-4 backdrop-blur-sm duration-100"
      >
        <div
          class="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 max-h-[28rem] overflow-y-auto"
        >
          <!-- 历史搜索记录 -->
          <div v-if="searchHistory.length > 0" class="mb-3">
            <div class="mb-3">
              <span class="text-foreground font-medium">搜索历史</span>
            </div>
            <!-- flex布局，自适应每行显示数量 -->
            <div class="flex flex-wrap gap-1">
              <div
                v-for="(item, index) in searchHistory"
                :key="index"
                class="group border-border/40 bg-card/50 hover:border-border/80 hover:bg-card/80 relative cursor-pointer overflow-hidden border p-0.5 transition-all duration-200 hover:shadow-sm"
                @click="searchFromHistory(item)"
                :class="{ 'cursor-not-allowed opacity-50': isSearching }"
              >
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-muted-foreground">{{
                    item.serverName
                  }}</span>
                  <span class="text-foreground">{{ item.name }}</span>
                </div>
                <!-- 底部装饰线 -->
                <div
                  class="bg-primary absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
                ></div>
              </div>
            </div>
          </div>

          <!-- 分隔线 -->
          <div
            v-if="searchHistory.length > 0 && onlineFriends.length > 0"
            class="mb-3"
          >
            <Separator class="bg-border/30" />
          </div>

          <!-- 好友列表 -->
          <div v-if="onlineFriends.length > 0">
            <div class="mb-3">
              <span class="text-foreground font-medium">在线好友</span>
              <span class="text-muted-foreground ml-2 text-xs">
                {{ onlineFriends.length }}
              </span>
            </div>
            <!-- 好友flex布局，自适应每行显示数量 -->
            <div class="flex flex-wrap gap-2">
              <div
                v-for="friend in onlineFriends"
                :key="friend.id"
                class="group border-border/40 bg-card/50 hover:border-border/80 hover:bg-card/80 relative cursor-pointer overflow-hidden rounded-lg border px-3 py-2 transition-all duration-200 hover:shadow-sm"
                @click="searchFromFriend(friend)"
                :class="{ 'cursor-not-allowed opacity-50': isSearching }"
              >
                <!-- 在线装饰线 -->
                <div
                  class="absolute top-0 left-0 h-full w-1 bg-green-500"
                ></div>
                <div class="flex items-center gap-2 pl-1">
                  <span class="text-foreground text-xs font-medium">{{
                    friend.displayName
                  }}</span>
                  <span class="text-muted-foreground text-xs"
                    >#{{ friend.tagLine }}</span
                  >
                </div>
                <!-- 底部装饰线 -->
                <div
                  class="absolute bottom-0 left-0 h-0.5 w-0 bg-green-500 transition-all duration-300 group-hover:w-full"
                ></div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="searchHistory.length === 0 && onlineFriends.length === 0"
            class="p-8 text-center"
          >
            <h3 class="text-foreground mb-1 text-sm font-medium">
              暂无搜索记录
            </h3>
            <p
              class="text-muted-foreground mx-auto max-w-48 text-xs leading-relaxed"
            >
              开始搜索召唤师来建立历史记录
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
