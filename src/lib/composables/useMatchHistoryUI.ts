import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 战绩历史UI交互 Composable
 */
export function useMatchHistoryUI() {
  // UI状态
  const isSticky = ref(false);
  const sentinelRef = ref<HTMLElement | null>(null);
  let observer: IntersectionObserver | null = null;

  // 控制对局展开/收起状态
  function toggleMatchDetail(gameId: number, expandedMatches: Set<number>) {
    if (expandedMatches.has(gameId)) {
      expandedMatches.delete(gameId);
    } else {
      expandedMatches.add(gameId);
    }
  }

  // 分页处理方法
  function handlePageChange(
    page: number,
    currentPage: { value: number },
    loadCallback: (tag: string) => void,
    currentTag: string
  ) {
    currentPage.value = page;
    loadCallback(currentTag);
  }

  function handlePageSizeChange(
    size: number,
    pageSize: { value: number },
    loadCallback: (tag: string) => void,
    currentTag: string
  ) {
    pageSize.value = size;
    loadCallback(currentTag);
  }

  // 初始化吸附状态监测
  const initStickyObserver = () => {
    if (sentinelRef.value) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isSticky.value = !entry.isIntersecting;
        },
        {
          threshold: 0,
          rootMargin: '-40px 0px 0px 0px',
        }
      );
      observer.observe(sentinelRef.value);
    }
  };

  // 清理观察器
  const cleanupObserver = () => {
    observer?.disconnect();
    observer = null;
  };

  onMounted(() => {
    initStickyObserver();
  });

  onUnmounted(() => {
    cleanupObserver();
  });

  return {
    // 状态
    isSticky,
    sentinelRef,

    // 方法
    toggleMatchDetail,
    handlePageChange,
    handlePageSizeChange,
    initStickyObserver,
    cleanupObserver,
  };
}
