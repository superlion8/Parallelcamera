/**
 * IndexedDB 工具 - 用于存储平行相机的历史记录
 * 
 * 优势：
 * - 存储容量大（通常 50MB - 几个GB，远超 localStorage 的 5-10MB）
 * - 支持存储 Blob 对象（图片更高效）
 * - 异步操作，不阻塞主线程
 * - 支持索引和查询
 */

export interface GeneratedResult {
  id?: number; // IndexedDB 自动生成的 ID
  description: string;
  generatedImage: string;
  originalImage: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  mode: 'realistic' | 'creative' | 'meta';
  creativeElement?: string;
  // For meta mode
  userPrompt?: string;
  // Legacy fields (kept for backward compatibility)
  realisticImage?: string;
  creativeImage?: string;
  realisticDescription?: string;
  creativeDescription?: string;
  timestamp: number;
  characterName?: string; // 使用的角色名字
}

const DB_NAME = 'ParallelCameraDB';
const DB_VERSION = 2; // 升级到版本 2 以支持 characters store
const STORE_NAME = 'history';
const CHARACTERS_STORE = 'characters';

/**
 * 打开或创建 IndexedDB 数据库
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('IndexedDB 打开成功');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      console.log('IndexedDB 升级/创建中，版本:', event.oldVersion, '->', event.newVersion);
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建 history store（如果不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // 创建索引以便按时间戳查询
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        objectStore.createIndex('mode', 'mode', { unique: false });

        console.log('History store 创建成功');
      }

      // 创建 characters store（如果存在）
      if (!db.objectStoreNames.contains(CHARACTERS_STORE)) {
        const charactersStore = db.createObjectStore(CHARACTERS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        charactersStore.createIndex('name', 'name', { unique: false });
        charactersStore.createIndex('createdAt', 'createdAt', { unique: false });
        charactersStore.createIndex('usageCount', 'usageCount', { unique: false });
        console.log('Characters store 创建成功');
      }
    };
  });
}

/**
 * 保存一条历史记录
 */
export async function saveHistory(result: Omit<GeneratedResult, 'id'>): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);

    // 添加时间戳
    const dataToSave: Omit<GeneratedResult, 'id'> = {
      ...result,
      timestamp: result.timestamp || Date.now(),
    };

    const request = objectStore.add(dataToSave);

    request.onsuccess = () => {
      const id = request.result as number;
      console.log('历史记录保存成功, ID:', id);
      resolve(id);
    };

    request.onerror = () => {
      console.error('保存历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 获取所有历史记录（按时间倒序）
 */
export async function getAllHistory(): Promise<GeneratedResult[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('timestamp');

    // 使用游标按时间戳倒序获取所有记录
    const request = index.openCursor(null, 'prev');
    const results: GeneratedResult[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        console.log('获取历史记录成功，共', results.length, '条');
        resolve(results);
      }
    };

    request.onerror = () => {
      console.error('获取历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 根据 ID 获取单条历史记录
 */
export async function getHistoryById(id: number): Promise<GeneratedResult | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('获取历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 删除一条历史记录
 */
export async function deleteHistory(id: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      console.log('历史记录删除成功, ID:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('删除历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 清空所有历史记录
 */
export async function clearAllHistory(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();

    request.onsuccess = () => {
      console.log('所有历史记录已清空');
      resolve();
    };

    request.onerror = () => {
      console.error('清空历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 获取历史记录数量
 */
export async function getHistoryCount(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.count();

    request.onsuccess = () => {
      console.log('历史记录总数:', request.result);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('获取记录数量失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 按模式获取历史记录
 */
export async function getHistoryByMode(mode: 'realistic' | 'creative' | 'meta'): Promise<GeneratedResult[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const index = objectStore.index('mode');
    const request = index.getAll(mode);

    request.onsuccess = () => {
      // 按时间戳倒序排序
      const results = (request.result || []).sort((a: GeneratedResult, b: GeneratedResult) => 
        b.timestamp - a.timestamp
      );
      console.log('获取', mode, '模式历史记录:', results.length, '条');
      resolve(results);
    };

    request.onerror = () => {
      console.error('获取历史记录失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 获取最近 N 条历史记录
 */
export async function getRecentHistory(limit: number = 20): Promise<GeneratedResult[]> {
  const allHistory = await getAllHistory();
  return allHistory.slice(0, limit);
}

/**
 * 数据库统计信息
 */
export async function getDatabaseStats(): Promise<{
  totalCount: number;
  realisticCount: number;
  creativeCount: number;
  metaCount: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}> {
  const allHistory = await getAllHistory();
  
  const stats = {
    totalCount: allHistory.length,
    realisticCount: allHistory.filter(h => h.mode === 'realistic').length,
    creativeCount: allHistory.filter(h => h.mode === 'creative').length,
    metaCount: allHistory.filter(h => h.mode === 'meta').length,
    oldestTimestamp: allHistory.length > 0 ? allHistory[allHistory.length - 1].timestamp : undefined,
    newestTimestamp: allHistory.length > 0 ? allHistory[0].timestamp : undefined,
  };

  console.log('数据库统计:', stats);
  return stats;
}