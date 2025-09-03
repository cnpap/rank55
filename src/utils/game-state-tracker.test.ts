import { describe, it, expect, beforeEach } from 'vitest';
import { ref } from 'vue';
import { GameflowPhaseEnum } from '@/types/gameflow-session';

// 模拟游戏状态记录机制的测试
describe('游戏状态记录机制', () => {
  let gameStateRecord: any;
  let currentPhase: any;
  let shouldTriggerBusinessFunction: any;
  let resetGameStateRecord: any;

  beforeEach(() => {
    // 模拟实际的状态记录逻辑
    gameStateRecord = ref({
      lastRecordedPhase: null as GameflowPhaseEnum | null,
      champSelectTriggered: false,
      gameStartTriggered: false,
      inProgressTriggered: false,
    });

    currentPhase = ref(GameflowPhaseEnum.None);

    resetGameStateRecord = () => {
      gameStateRecord.value = {
        lastRecordedPhase: null,
        champSelectTriggered: false,
        gameStartTriggered: false,
        inProgressTriggered: false,
      };
    };

    shouldTriggerBusinessFunction = (
      targetPhase: GameflowPhaseEnum
    ): boolean => {
      const current = currentPhase.value;
      const record = gameStateRecord.value;

      // 如果当前阶段发生了变化，需要重新评估触发条件
      if (record.lastRecordedPhase !== current) {
        record.lastRecordedPhase = current;

        // 当阶段变化时，根据新阶段重置相应的触发状态
        if (current === GameflowPhaseEnum.ChampSelect) {
          // 进入ChampSelect时，重置后续阶段的触发状态
          record.gameStartTriggered = false;
          record.inProgressTriggered = false;
        } else if (current === GameflowPhaseEnum.GameStart) {
          // 进入GameStart时，重置InProgress的触发状态
          record.inProgressTriggered = false;
        } else if (current === GameflowPhaseEnum.InProgress) {
          // 进入InProgress时，不需要重置其他状态
        } else if (
          [
            GameflowPhaseEnum.EndOfGame,
            GameflowPhaseEnum.PreEndOfGame,
            GameflowPhaseEnum.WaitingForStats,
            GameflowPhaseEnum.Lobby,
            GameflowPhaseEnum.None,
          ].includes(current)
        ) {
          // 游戏结束或回到大厅时，重置所有触发状态
          resetGameStateRecord();
          return false;
        }
      }

      // 检查目标阶段是否应该触发
      switch (targetPhase) {
        case GameflowPhaseEnum.ChampSelect:
          if (
            current === GameflowPhaseEnum.ChampSelect &&
            !record.champSelectTriggered
          ) {
            record.champSelectTriggered = true;
            return true;
          }
          break;

        case GameflowPhaseEnum.GameStart:
          if (
            (current === GameflowPhaseEnum.GameStart ||
              current === GameflowPhaseEnum.InProgress) &&
            !record.gameStartTriggered
          ) {
            record.gameStartTriggered = true;
            return true;
          }
          break;

        case GameflowPhaseEnum.InProgress:
          if (
            current === GameflowPhaseEnum.InProgress &&
            !record.inProgressTriggered
          ) {
            record.inProgressTriggered = true;
            return true;
          }
          break;
      }

      return false;
    };
  });

  it('应该在ChampSelect阶段只触发一次', () => {
    // 进入ChampSelect阶段
    currentPhase.value = GameflowPhaseEnum.ChampSelect;

    // 第一次应该触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect)).toBe(
      true
    );
    expect(gameStateRecord.value.champSelectTriggered).toBe(true);

    // 第二次不应该触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect)).toBe(
      false
    );
  });

  it('应该在GameStart/InProgress阶段只触发一次', () => {
    // 进入GameStart阶段
    currentPhase.value = GameflowPhaseEnum.GameStart;

    // 第一次应该触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      true
    );
    expect(gameStateRecord.value.gameStartTriggered).toBe(true);

    // 第二次不应该触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      false
    );

    // 转换到InProgress阶段，GameStart业务函数仍然不应该再次触发
    currentPhase.value = GameflowPhaseEnum.InProgress;
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      false
    );
  });

  it('应该在阶段转换时正确重置触发状态', () => {
    // 先进入ChampSelect并触发
    currentPhase.value = GameflowPhaseEnum.ChampSelect;
    shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect);
    expect(gameStateRecord.value.champSelectTriggered).toBe(true);

    // 转换到GameStart阶段
    currentPhase.value = GameflowPhaseEnum.GameStart;

    // GameStart应该能够触发（因为是新阶段）
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      true
    );
    expect(gameStateRecord.value.gameStartTriggered).toBe(true);

    // 但ChampSelect不应该再次触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect)).toBe(
      false
    );
  });

  it('应该在游戏结束时重置所有状态', () => {
    // 设置一些触发状态
    currentPhase.value = GameflowPhaseEnum.ChampSelect;
    shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect);

    currentPhase.value = GameflowPhaseEnum.GameStart;
    shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart);

    expect(gameStateRecord.value.champSelectTriggered).toBe(true);
    expect(gameStateRecord.value.gameStartTriggered).toBe(true);

    // 游戏结束
    currentPhase.value = GameflowPhaseEnum.EndOfGame;
    shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect); // 这会触发重置

    // 所有状态应该被重置
    expect(gameStateRecord.value.champSelectTriggered).toBe(false);
    expect(gameStateRecord.value.gameStartTriggered).toBe(false);
    expect(gameStateRecord.value.inProgressTriggered).toBe(false);
    expect(gameStateRecord.value.lastRecordedPhase).toBe(null);
  });

  it('应该正确处理从ChampSelect到GameStart再到InProgress的完整流程', () => {
    // 1. 进入ChampSelect
    currentPhase.value = GameflowPhaseEnum.ChampSelect;
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect)).toBe(
      true
    );
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.ChampSelect)).toBe(
      false
    ); // 第二次不触发

    // 2. 进入GameStart
    currentPhase.value = GameflowPhaseEnum.GameStart;
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      true
    );
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      false
    ); // 第二次不触发

    // 3. 进入InProgress
    currentPhase.value = GameflowPhaseEnum.InProgress;
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.GameStart)).toBe(
      false
    ); // GameStart不应该再次触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.InProgress)).toBe(
      true
    ); // InProgress应该触发
    expect(shouldTriggerBusinessFunction(GameflowPhaseEnum.InProgress)).toBe(
      false
    ); // 第二次不触发
  });
});
