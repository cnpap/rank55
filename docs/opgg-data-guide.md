# OP.GG 英雄排行榜数据说明文档

本文档详细说明了通过 `OpggService.getChampionsTier()` 方法获取的英雄排行榜数据结构和各字段含义。

## 数据结构概览

```typescript
interface OpggRankedChampionsSummary {
  data: OpggRankedDataItem[]; // 英雄数据列表
  meta: {
    // 元数据信息
    version: string; // 游戏版本
    cached_at: string; // 缓存时间
    match_count: number; // 分析的比赛数量
    analyzed_at: string; // 分析时间
  };
}
```

## 单个英雄数据结构 (OpggRankedDataItem)

### 基础信息

| 字段          | 类型    | 说明                 | 示例         |
| ------------- | ------- | -------------------- | ------------ |
| `id`          | number  | 英雄ID               | `3` (加里奥) |
| `is_rotation` | boolean | 是否在免费英雄轮换中 | `true`       |
| `is_rip`      | boolean | 英雄是否被重做/移除  | `false`      |

### 整体统计数据 (average_stats)

| 字段        | 类型   | 说明       | 示例值      | 含义                  |
| ----------- | ------ | ---------- | ----------- | --------------------- |
| `play`      | number | 总游戏场次 | `2320`      | 该英雄被使用的总次数  |
| `win_rate`  | number | 胜率       | `0.484483`  | 48.45% 胜率           |
| `pick_rate` | number | 选取率     | `0.069077`  | 6.91% 选取率          |
| `ban_rate`  | number | 禁用率     | `0.0334041` | 3.34% 禁用率          |
| `kda`       | number | KDA比值    | `2.684292`  | (击杀+助攻)/死亡      |
| `tier`      | number | 强度等级   | `3`         | 1-5级，1最强，5最弱   |
| `rank`      | number | 整体排名   | `114`       | 在所有英雄中排第114位 |

#### 排名变化数据 (tier_data)

| 字段              | 类型   | 说明         | 示例值 |
| ----------------- | ------ | ------------ | ------ |
| `tier`            | number | 当前强度等级 | `3`    |
| `rank`            | number | 当前排名     | `114`  |
| `rank_prev`       | number | 上个版本排名 | `105`  |
| `rank_prev_patch` | number | 上个补丁排名 | `39`   |

### 位置数据 (positions)

每个英雄可以在多个位置使用，每个位置都有独立的统计数据：

#### 位置统计 (stats)

| 字段        | 类型   | 说明           | 示例值      | 含义               |
| ----------- | ------ | -------------- | ----------- | ------------------ |
| `name`      | string | 位置名称       | `"MID"`     | 中路               |
| `play`      | number | 该位置游戏场次 | `1947`      | 在中路的使用次数   |
| `win_rate`  | number | 该位置胜率     | `0.479712`  | 中路47.97%胜率     |
| `pick_rate` | number | 该位置选取率   | `0.05793`   | 在中路位置的选取率 |
| `role_rate` | number | 位置占比       | `0.839224`  | 83.92%的场次在中路 |
| `ban_rate`  | number | 该位置禁用率   | `0.0333773` | 中路位置的禁用率   |
| `kda`       | number | 该位置KDA      | `2.740388`  | 中路位置的KDA      |

#### 角色分工 (roles)

每个位置下，英雄可能承担不同的角色：

| 字段        | 类型   | 说明       | 示例                               |
| ----------- | ------ | ---------- | ---------------------------------- |
| `name`      | string | 角色名称   | `"MAGE"`, `"TANK"`, `"CONTROLLER"` |
| `win_rate`  | number | 该角色胜率 | `0.501695`                         |
| `role_rate` | number | 角色占比   | `0.610766` (61.08%的场次作为法师)  |
| `play`      | number | 该角色场次 | `1180`                             |
| `win`       | number | 该角色胜场 | `592`                              |

**常见角色类型：**

- `MAGE`: 法师 - 主要输出魔法伤害
- `TANK`: 坦克 - 承受伤害，保护队友
- `CONTROLLER`: 控制型 - 提供控制和辅助效果
- `FIGHTER`: 战士 - 近战物理输出
- `MARKSMAN`: 射手 - 远程物理输出
- `ASSASSIN`: 刺客 - 高爆发击杀敌方核心

#### 克制关系 (counters)

显示该英雄容易被哪些英雄克制：

| 字段          | 类型   | 说明         | 示例值       |
| ------------- | ------ | ------------ | ------------ |
| `champion_id` | number | 克制英雄的ID | `142` (亚索) |
| `play`        | number | 对局次数     | `31`         |
| `win`         | number | 胜利次数     | `10`         |

**解读：** 如果胜率低于50%，说明该英雄容易被克制。

## 位置名称对照

| 英文名称  | 中文名称 | 说明         |
| --------- | -------- | ------------ |
| `TOP`     | 上路     | 上单位置     |
| `JUNGLE`  | 打野     | 野区位置     |
| `MID`     | 中路     | 中单位置     |
| `ADC`     | 下路     | ADC/射手位置 |
| `SUPPORT` | 辅助     | 辅助位置     |

## 强度等级说明

| 等级 | 说明            | 颜色标识 |
| ---- | --------------- | -------- |
| 1    | OP级 - 非常强势 | 红色     |
| 2    | 强势 - 值得选择 | 橙色     |
| 3    | 平衡 - 中等强度 | 黄色     |
| 4    | 弱势 - 需要技巧 | 蓝色     |
| 5    | 很弱 - 不推荐   | 灰色     |

## 数据解读示例

以您提供的加里奥数据为例：

```json
{
  "id": 3,
  "is_rotation": true,
  "is_rip": false,
  "average_stats": {
    "play": 2320,
    "win_rate": 0.484483,
    "pick_rate": 0.069077,
    "ban_rate": 0.0334041,
    "kda": 2.684292,
    "tier": 3,
    "rank": 114
  }
}
```

**解读：**

- 加里奥目前在免费轮换中
- 总体胜率48.45%，略低于平衡线
- 选取率6.91%，属于中等热度
- 禁用率3.34%，不是热门禁用目标
- 强度等级3，属于平衡级别
- 整体排名114位，中等偏下

**中路表现：**

- 83.92%的场次在中路使用
- 中路胜率47.97%
- 主要作为法师使用(61.08%)，也可作为坦克(38.46%)
- 容易被亚索、维克托等英雄克制

## 使用建议

1. **选择英雄时：**
   - 优先选择tier 1-2的英雄
   - 注意英雄在目标位置的role_rate
   - 查看counters避免被克制

2. **分析数据时：**
   - 胜率 > 50% 为强势
   - pick_rate 反映热度
   - ban_rate 反映威胁程度
   - rank_prev 变化反映版本影响

3. **版本适应：**
   - 关注rank变化趋势
   - 新版本数据需要时间稳定
   - 结合meta变化分析

## 相关类型定义

完整的TypeScript类型定义可以在以下文件中找到：

- `demo/opgg/types.ts` - OP.GG数据类型
- `src/lib/service/opgg-service.ts` - 服务接口

## API使用示例

```typescript
import { OpggService } from '@/lib/service/opgg-service';

const opggService = new OpggService();

// 获取铂金以上排位数据
const data = await opggService.getChampionsTier({
  region: 'global',
  mode: 'ranked',
  tier: 'platinum_plus',
});

// 分析特定英雄
const galio = data.data.find(champion => champion.id === 3);
if (galio) {
  console.log(
    `加里奥胜率: ${(galio.average_stats.win_rate * 100).toFixed(2)}%`
  );
  console.log(`整体排名: ${galio.average_stats.rank}`);
}
```
