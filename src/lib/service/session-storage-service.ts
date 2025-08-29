import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { GameflowSession } from '@/types/gameflow-session';

interface SessionDB extends DBSchema {
  gameflowSessions: {
    key: string;
    value: {
      id: string;
      gameflowSession: GameflowSession;
      timestamp: number;
    };
    indexes: {
      timestamp: 'timestamp';
    };
  };
}

export class SessionStorageService {
  private db: IDBPDatabase<SessionDB> | null = null;
  private readonly DB_NAME = 'lol-sessions';
  private readonly DB_VERSION = 2;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<SessionDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // 创建或重建 gameflowSessions 存储
        if (db.objectStoreNames.contains('gameflowSessions')) {
          db.deleteObjectStore('gameflowSessions');
        }

        const gameflowStore = db.createObjectStore('gameflowSessions', {
          keyPath: 'id',
        });
        gameflowStore.createIndex('timestamp', 'timestamp');
      },
    });
  }

  async saveGameflowSession(gameflowSession: GameflowSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessionData = {
      id: gameflowSession.gameData?.gameId?.toString() || Date.now().toString(),
      gameflowSession,
      timestamp: Date.now(),
    };

    await this.db.put('gameflowSessions', sessionData);
  }

  async getGameflowSession(sessionId: string): Promise<GameflowSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessionData = await this.db.get('gameflowSessions', sessionId);
    return sessionData?.gameflowSession || null;
  }

  async getLatestGameflowSession(): Promise<GameflowSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('gameflowSessions', 'readonly');
    const index = tx.store.index('timestamp');
    const cursor = await index.openCursor(null, 'prev');

    return cursor?.value?.gameflowSession || null;
  }

  async getAllGameflowSessions(): Promise<GameflowSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.db.getAll('gameflowSessions');
    return sessions.map(s => s.gameflowSession);
  }

  async deleteGameflowSession(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('gameflowSessions', sessionId);
  }

  async clearOldGameflowSessions(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - maxAge;
    const tx = this.db.transaction('gameflowSessions', 'readwrite');
    const index = tx.store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffTime);

    for await (const cursor of index.iterate(range)) {
      await cursor.delete();
    }
  }
}
