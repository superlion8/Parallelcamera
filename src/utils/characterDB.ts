/**
 * Character IndexedDB 工具 - 用于存储平行相机的角色数据
 * 
 * 角色系统：用户可以创建虚拟角色，上传参考照片，
 * 在生成图片时将角色融入到场景中
 */

export interface Character {
  id?: number; // IndexedDB 自动生成的 ID
  name: string; // 角色名字
  referenceImage: string; // 参考照片（Base64）
  description?: string; // 角色描述（可选）
  createdAt: number; // 创建时间戳
  usageCount: number; // 使用次数
  lastUsedAt?: number; // 最后使用时间
}

const DB_NAME = 'ParallelCameraDB';
const DB_VERSION = 2; // 升级版本以添加 characters store
const CHARACTERS_STORE = 'characters';
const HISTORY_STORE = 'history';

/**
 * 打开或创建 IndexedDB 数据库（支持角色存储）
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
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        const historyStore = db.createObjectStore(HISTORY_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('mode', 'mode', { unique: false });
        console.log('History store 创建成功');
      }

      // 创建 characters store（如果不存在）
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
 * 创建一个新角色
 */
export async function createCharacter(character: Omit<Character, 'id'>): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHARACTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CHARACTERS_STORE);

    const dataToSave: Omit<Character, 'id'> = {
      ...character,
      createdAt: character.createdAt || Date.now(),
      usageCount: character.usageCount || 0,
    };

    const request = objectStore.add(dataToSave);

    request.onsuccess = () => {
      const id = request.result as number;
      console.log('角色创建成功, ID:', id, '名字:', character.name);
      resolve(id);
    };

    request.onerror = () => {
      console.error('创建角色失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 获取所有角色（按创建时间倒序）
 */
export async function getAllCharacters(): Promise<Character[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHARACTERS_STORE], 'readonly');
    const objectStore = transaction.objectStore(CHARACTERS_STORE);
    const index = objectStore.index('createdAt');

    const request = index.openCursor(null, 'prev');
    const results: Character[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        console.log('获取角色列表成功，共', results.length, '个');
        resolve(results);
      }
    };

    request.onerror = () => {
      console.error('获取角色列表失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 根据 ID 获取单个角色
 */
export async function getCharacterById(id: number): Promise<Character | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHARACTERS_STORE], 'readonly');
    const objectStore = transaction.objectStore(CHARACTERS_STORE);
    const request = objectStore.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('获取角色失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 更新角色信息
 */
export async function updateCharacter(id: number, updates: Partial<Omit<Character, 'id'>>): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHARACTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CHARACTERS_STORE);
    
    // 先获取现有数据
    const getRequest = objectStore.get(id);

    getRequest.onsuccess = () => {
      const existingData = getRequest.result;
      if (!existingData) {
        reject(new Error('Character not found'));
        return;
      }

      // 合并更新
      const updatedData = {
        ...existingData,
        ...updates,
      };

      const putRequest = objectStore.put(updatedData);

      putRequest.onsuccess = () => {
        console.log('角色更新成功, ID:', id);
        resolve();
      };

      putRequest.onerror = () => {
        console.error('更新角色失败:', putRequest.error);
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error('获取角色失败:', getRequest.error);
      reject(getRequest.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 删除一个角色
 */
export async function deleteCharacter(id: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CHARACTERS_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CHARACTERS_STORE);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      console.log('角色删除成功, ID:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('删除角色失败:', request.error);
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 增加角色使用次数
 */
export async function incrementCharacterUsage(id: number): Promise<void> {
  const character = await getCharacterById(id);
  if (!character) {
    throw new Error('Character not found');
  }

  await updateCharacter(id, {
    usageCount: character.usageCount + 1,
    lastUsedAt: Date.now(),
  });
}

/**
 * 获取最常用的角色
 */
export async function getMostUsedCharacters(limit: number = 5): Promise<Character[]> {
  const allCharacters = await getAllCharacters();
  return allCharacters
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * 角色统计信息
 */
export async function getCharactersStats(): Promise<{
  totalCount: number;
  mostUsed?: Character;
  totalUsage: number;
}> {
  const allCharacters = await getAllCharacters();
  
  const stats = {
    totalCount: allCharacters.length,
    mostUsed: allCharacters.length > 0 
      ? allCharacters.reduce((max, char) => char.usageCount > max.usageCount ? char : max)
      : undefined,
    totalUsage: allCharacters.reduce((sum, char) => sum + char.usageCount, 0),
  };

  console.log('角色统计:', stats);
  return stats;
}
