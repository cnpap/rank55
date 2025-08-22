<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
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
import SearchHistory from '@/components/SearchHistory.vue';
import FriendsList from '@/components/FriendsList.vue';
import { useMatchHistoryStore } from '@/stores/match-history';
import { SearchHistoryItem } from '@/storages/storage-use';
import { useClientUserStore } from '@/stores/client-user';
import { FriendService, Friend } from '@/lib/service/friend-service';
import { SimpleFriend } from '@/types/friend';

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

const userStore = useClientUserStore();
const matchHistoryStore = useMatchHistoryStore();

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

// 好友服务和数据
const friendService = ref<FriendService | null>(null);
const friends = ref<Friend[]>([]);
const isLoadingFriends = ref(false);
// 添加定时器引用
const friendsRefreshTimer = ref<NodeJS.Timeout | null>(null);

// 初始化好友服务
const initFriendService = async () => {
  try {
    friendService.value = new FriendService();
    await loadFriends();
    // 启动定时刷新
    startFriendsRefresh();
  } catch (error) {
    console.warn('无法连接到LOL客户端，好友功能不可用:', error);
  }
};

// 加载好友列表
const loadFriends = async () => {
  if (!friendService.value) return;

  try {
    isLoadingFriends.value = true;
    friends.value = await friendService.value.getOnlineFriends();
  } catch (error) {
    console.error('获取好友列表失败:', error);
    friends.value = [];
  } finally {
    isLoadingFriends.value = false;
  }
};

// 启动定时刷新好友列表
const startFriendsRefresh = () => {
  // 清除现有定时器
  if (friendsRefreshTimer.value) {
    clearInterval(friendsRefreshTimer.value);
  }

  // 每30秒刷新一次好友列表
  friendsRefreshTimer.value = setInterval(() => {
    if (friendService.value) {
      loadFriends();
    }
  }, 30000);
};

// 停止定时刷新
const stopFriendsRefresh = () => {
  if (friendsRefreshTimer.value) {
    clearInterval(friendsRefreshTimer.value);
    friendsRefreshTimer.value = null;
  }
};

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

// 转换好友数据为简化格式
const simplifiedFriends = computed(() => {
  return friends.value.map(friend => ({
    id: friend.id,
    gameName: friend.gameName,
    tagLine: friend.gameTag,
    isOnline: ['online', 'chat', 'mobile', 'spectating', 'dnd'].includes(
      friend.availability
    ),
    isInGame: friend.lol?.gameStatus === 'inGame',
  }));
});

// 搜索功能
const handleSearch = async () => {
  if (!summonerName.value.name.trim()) return;

  try {
    await matchHistoryStore.searchSummonerByName(summonerName.value.name);
    // 搜索成功后关闭弹出框
    isDropdownOpen.value = false;
  } catch (error: any) {
    console.error('搜索失败:', error);
  }
};

// 搜索当前登录的召唤师
const searchCurrentSummoner = async () => {
  try {
    await matchHistoryStore.searchSummonerByName(
      userStore.fullGameName,
      userStore.serverId
    );
    isDropdownOpen.value = false;
  } catch (error: any) {
    console.error('搜索当前召唤师失败:', error);
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
const searchFromFriend = async (friend: SimpleFriend) => {
  await matchHistoryStore.searchSummonerByName(
    `${friend.gameName}#${friend.tagLine}`,
    userStore.serverId
  );
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

// 监听弹出框状态，打开时刷新好友列表
watch(isDropdownOpen, newValue => {
  if (newValue && friendService.value) {
    // 弹出框打开时立即刷新好友列表
    loadFriends();
  }
});

// 组件挂载时添加事件监听器和初始化好友服务
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  initFriendService();
});

// 组件卸载时移除事件监听器和清理定时器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  stopFriendsRefresh();
});

// 暴露方法给父组件
defineExpose({
  handleSearch,
  searchCurrentSummoner,
  searchFromHistory,
  clearInput: () => {
    summonerName.value.name = '';
  },
  refreshFriends: loadFriends,
  // 暴露定时器控制方法
  startFriendsRefresh,
  stopFriendsRefresh,
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

      <!-- 弹出框内容 - 使用子组件 -->
      <div
        v-if="isDropdownOpen"
        class="font-tektur-numbers border-border/50 from-background/95 to-background/90 animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-0.5 w-120 border bg-gradient-to-b p-4 backdrop-blur-sm duration-100"
      >
        <div
          class="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 max-h-[28rem] overflow-y-auto"
        >
          <!-- 历史搜索记录组件 -->
          <SearchHistory
            :search-history="searchHistory"
            :is-searching="isSearching"
            @search-from-history="searchFromHistory"
          />

          <!-- 分隔线 -->
          <div
            v-if="searchHistory.length > 0 && simplifiedFriends.length > 0"
            class="mb-3"
          >
            <Separator class="bg-border/30" />
          </div>

          <!-- 好友列表组件 -->
          <FriendsList
            :friends="simplifiedFriends"
            :is-searching="isSearching || isLoadingFriends"
            @search-from-friend="searchFromFriend"
          />

          <!-- 空状态 -->
          <div
            v-if="
              searchHistory.length === 0 &&
              simplifiedFriends.length === 0 &&
              !isLoadingFriends
            "
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

          <!-- 加载状态 -->
          <div v-if="isLoadingFriends" class="p-4 text-center">
            <Loading size="sm" />
            <p class="text-muted-foreground mt-2 text-xs">加载好友列表中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
