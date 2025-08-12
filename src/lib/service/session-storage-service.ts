import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChampSelectSession } from '@/types/champ-select-session';

interface SessionDB extends DBSchema {
  sessions: {
    key: string;
    value: {
      id: string;
      session: ChampSelectSession;
      timestamp: number;
      gameStarted: boolean;
    };
  };
}

export class SessionStorageService {
  private db: IDBPDatabase<SessionDB> | null = null;
  private readonly DB_NAME = 'lol-sessions';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<SessionDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('gameStarted', 'gameStarted');
        }
      },
    });
  }

  async saveSession(session: ChampSelectSession): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessionData = {
      id: session.id,
      session,
      timestamp: Date.now(),
      gameStarted: true, // 标记为游戏已开始
    };

    await this.db.put('sessions', sessionData);
    console.log(`✅ Session ${session.id} 已持久化到 IDB`);
  }

  async getSession(sessionId: string): Promise<ChampSelectSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessionData = await this.db.get('sessions', sessionId);
    return sessionData?.session || null;
  }

  async getLatestSession(): Promise<ChampSelectSession | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const tx = this.db.transaction('sessions', 'readonly');
    const index = tx.store.index('timestamp');
    const cursor = await index.openCursor(null, 'prev');

    return cursor?.value?.session || null;
  }

  async getAllSessions(): Promise<ChampSelectSession[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.db.getAll('sessions');
    return sessions.map(s => s.session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    await this.db.delete('sessions', sessionId);
  }

  async clearOldSessions(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - maxAge;
    const tx = this.db.transaction('sessions', 'readwrite');
    const index = tx.store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffTime);

    for await (const cursor of index.iterate(range)) {
      await cursor.delete();
    }
  }
}
