# 📊 IndexedDB 存储迁移说明

## 🎯 问题背景

### 原有方案的限制
```
❌ 存储位置：Supabase KV（服务器端）
❌ 数量限制：最多 50 条记录
❌ 大小限制：KV 存储总大小有限制
❌ 性能问题：每次操作需要网络请求
❌ 离线问题：无网络时无法访问历史记录
```

### 新方案优势
```
✅ 存储位置：IndexedDB（浏览器本地）
✅ 数量限制：几乎无限制（数千条记录）
✅ 大小限制：50MB - 几个 GB（视浏览器而定）
✅ 性能提升：本地存储，无网络延迟
✅ 离线支持：完全离线可用
✅ 自动备份：Service Worker 配合可实现云同步
```

---

## 📁 文件结构

### 新增文件

```
/utils/
├── indexedDB.ts          ← IndexedDB 核心工具
└── dbDebug.ts            ← 开发调试工具
```

### 修改文件

```
/App.tsx                  ← 使用 IndexedDB 替代服务器 API
```

### 保留文件（备用）

```
/supabase/functions/server/index.tsx  ← 服务器端历史 API（已弃用，但保留）
```

---

## 🚀 功能特性

### 1. IndexedDB 核心功能 (`/utils/indexedDB.ts`)

#### **数据库配置**
```typescript
const DB_NAME = 'ParallelCameraDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';
```

#### **支持的操作**

| 函数 | 功能 | 返回值 |
|------|------|--------|
| `saveHistory(result)` | 保存一条历史记录 | `Promise<number>` (ID) |
| `getAllHistory()` | 获取所有记录（时间倒序） | `Promise<GeneratedResult[]>` |
| `getHistoryById(id)` | 获取指定 ID 的记录 | `Promise<GeneratedResult \| null>` |
| `deleteHistory(id)` | 删除指定记录 | `Promise<void>` |
| `clearAllHistory()` | 清空所有记录 | `Promise<void>` |
| `getHistoryCount()` | 获取记录总数 | `Promise<number>` |
| `getHistoryByMode(mode)` | 按模式筛选记录 | `Promise<GeneratedResult[]>` |
| `getRecentHistory(limit)` | 获取最近 N 条 | `Promise<GeneratedResult[]>` |
| `getDatabaseStats()` | 获取统计信息 | `Promise<Stats>` |

---

### 2. 开发调试工具 (`/utils/dbDebug.ts`)

在开发模式下，浏览器控制台自动加载 `dbDebug` 对象。

#### **使用方法**

**查看帮助：**
```javascript
dbDebug.help()
```

**查看统计信息：**
```javascript
await dbDebug.showStats()
```

**输出示例：**
```
═══════════════════════════════════════
📊 平行相机 IndexedDB 统计信息
═══════════════════════════════════════

总记录数: 25
  ├─ 写实模式: 10
  ├─ 脑洞模式: 12
  └─ Mega模式: 3

最新记录: 2025/11/17 15:30:45
最旧记录: 2025/11/10 09:12:33

═══════════════════════════════════════
```

---

**查看所有记录（简略）：**
```javascript
await dbDebug.showAllHistory()
```

**输出示例：**
```
═══════════════════════════════════════
📜 所有历史记录 (共 25 条)
═══════════════════════════════════════

1. [写实] 2025/11/17 15:30:45
   这是一张在公园拍摄的照片，天空晴朗...
   ID: 25

2. [脑洞] 2025/11/17 14:22:10
   街道上出现了一扇通往异世界的发光传送门...
   ID: 24
...
```

---

**查看详细记录（含图片大小）：**
```javascript
await dbDebug.showDetailedHistory()
```

**输出示例：**
```
═══════════════════════════════════════
📸 详细历史记录 (共 25 条)
═══════════════════════════════════════

1. [写实] 2025/11/17 15:30:45 - ID: 25
   描述: 这是一张在公园拍摄的照片，天空晴朗...
   原图大小: 245.67 KB
   生成图大小: 312.45 KB
   小计: 558.12 KB
   位置: 39.9042, 116.4074

...

═══════════════════════════════════════
总存储大小: 15.23 MB
═══════════════════════════════════════
```

---

**查看指定记录：**
```javascript
await dbDebug.viewById(25)
```

**删除指定记录：**
```javascript
await dbDebug.deleteById(25)
```

**导出为 JSON：**
```javascript
await dbDebug.exportToJSON()
// 自动下载 JSON 文件到本地
```

**清空所有记录（需要二次确认）：**
```javascript
await dbDebug.clearAll()
// 显示警告和确认指令

await dbDebug.confirmClear("确认清空")
// ✅ 所有历史记录已清空
```

---

## 🔧 数据结构

### GeneratedResult 接口

```typescript
interface GeneratedResult {
  id?: number;                    // IndexedDB 自动生成
  description: string;            // AI 生成的描述
  generatedImage: string;         // 生成的图片（Base64）
  originalImage: string;          // 原始照片（Base64）
  location?: {                    // GPS 位置（可选）
    latitude: number;
    longitude: number;
  };
  mode: 'realistic' | 'creative' | 'mega';  // 生成模式
  creativeElement?: string;       // 脑洞模式的创意元素
  
  // Mega 模式专用
  realisticImage?: string;        // 写实版本图片
  creativeImage?: string;         // 脑洞版本图片
  realisticDescription?: string;  // 写实版本描述
  creativeDescription?: string;   // 脑洞版本描述
  
  timestamp: number;              // 创建时间戳
}
```

---

## 📊 存储容量对比

### localStorage (旧方案)
```
最大容量: 5-10 MB
存储类型: 字符串键值对
性能:     同步操作，阻塞主线程
适用场景: 小量配置数据
```

### IndexedDB (新方案)
```
最大容量: 50 MB - 几个 GB
存储类型: 对象、Blob、File
性能:     异步操作，不阻塞主线程
适用场景: 大量结构化数据
```

### 实际对比

| 数据类型 | 单条大小 | localStorage | IndexedDB |
|---------|---------|--------------|-----------|
| 单张照片 (Base64) | ~300 KB | ❌ 约 30 条 | ✅ 数千条 |
| Mega 模式 | ~600 KB | ❌ 约 15 条 | ✅ 数千条 |
| 总容量 | - | 5-10 MB | 50 MB - 几个 GB |

---

## 🔄 数据迁移指南

### 从旧版本升级

如果你之前使用了 Supabase KV 存储，可以手动迁移数据：

#### **1. 导出旧数据（如果有服务器访问权限）**

在浏览器控制台运行：

```javascript
// 从服务器获取旧历史记录
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/get-history`,
  {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
    },
  }
);
const { history } = await response.json();

// 保存到本地
localStorage.setItem('backup-history', JSON.stringify(history));
console.log('备份完成，共', history.length, '条记录');
```

#### **2. 导入到 IndexedDB**

```javascript
import * as indexedDB from './utils/indexedDB';

// 获取备份数据
const backupData = JSON.parse(localStorage.getItem('backup-history'));

// 逐条导入
for (const item of backupData) {
  await indexedDB.saveHistory(item);
}

console.log('导入完成！');
```

#### **3. 清理旧备份（可选）**

```javascript
localStorage.removeItem('backup-history');
```

---

## 🛠️ 故障排查

### 问题 1: IndexedDB 不可用

**症状：**
```
Error: IndexedDB is not available
```

**原因：**
- 隐私模式/无痕模式
- 浏览器禁用了 IndexedDB
- 存储空间已满

**解决方案：**
```javascript
// 检测 IndexedDB 是否可用
if (!window.indexedDB) {
  console.error('您的浏览器不支持 IndexedDB');
  // 降级到 localStorage 或提示用户
}
```

---

### 问题 2: 数据库版本冲突

**症状：**
```
Error: VersionError
```

**原因：**
- 数据库结构发生变化

**解决方案：**
```javascript
// 修改 DB_VERSION
const DB_VERSION = 2; // 从 1 增加到 2

// 在 onupgradeneeded 中处理迁移
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const oldVersion = event.oldVersion;
  
  if (oldVersion < 2) {
    // 执行从版本 1 到版本 2 的迁移
  }
};
```

---

### 问题 3: 存储空间不足

**症状：**
```
Error: QuotaExceededError
```

**原因：**
- 存储了太多图片

**解决方案：**
```javascript
// 1. 查看当前使用量
await dbDebug.showDetailedHistory()

// 2. 删除旧记录
const allHistory = await indexedDB.getAllHistory();
const oldItems = allHistory.slice(100); // 保留前 100 条

for (const item of oldItems) {
  await indexedDB.deleteHistory(item.id);
}

// 3. 或者压缩图片（在保存前）
// 使用 canvas 压缩 Base64 图片
```

---

## 📱 浏览器兼容性

### 支持的浏览器

| 浏览器 | 版本 | 支持 | 存储限额 |
|--------|------|------|----------|
| Chrome | 24+ | ✅ | ~60% 磁盘 |
| Firefox | 16+ | ✅ | ~50% 可用空间 |
| Safari | 10+ | ✅ | 1 GB |
| Edge | 12+ | ✅ | ~60% 磁盘 |
| iOS Safari | 10+ | ✅ | 500 MB - 1 GB |
| Android Chrome | 100% | ✅ | ~60% 磁盘 |

### 检测方法

```javascript
// 检查 IndexedDB 是否可用
const isIndexedDBAvailable = (() => {
  try {
    return !!window.indexedDB;
  } catch (e) {
    return false;
  }
})();

console.log('IndexedDB 可用:', isIndexedDBAvailable);
```

---

## 🔐 安全性考虑

### 1. 数据隐私
```
✅ IndexedDB 数据仅存储在本地浏览器
✅ 不同域名之间数据完全隔离
✅ 清除浏览器数据会删除所有记录
```

### 2. 数据持久性
```
⚠️  用户清除浏览器缓存会丢失数据
⚠️  隐私模式关闭后数据会消失
✅ 可配合 Service Worker 实现云同步
```

### 3. 存储配额
```javascript
// 查询存储配额
if (navigator.storage && navigator.storage.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  console.log('已使用:', (usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('总配额:', (quota / 1024 / 1024).toFixed(2), 'MB');
  console.log('使用率:', ((usage / quota) * 100).toFixed(2), '%');
}
```

---

## 🚀 性能优化

### 1. 批量操作

**不推荐（逐条插入）：**
```javascript
for (const item of items) {
  await indexedDB.saveHistory(item); // 每次打开/关闭数据库
}
```

**推荐（单次事务）：**
```javascript
// 创建批量保存函数
async function saveBatch(items) {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const objectStore = transaction.objectStore(STORE_NAME);
  
  for (const item of items) {
    objectStore.add(item);
  }
  
  return new Promise((resolve) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}
```

---

### 2. 图片压缩

保存前压缩 Base64 图片：

```javascript
function compressImage(base64: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });
}

// 使用
const compressed = await compressImage(originalImage, 0.7);
await indexedDB.saveHistory({ ...result, originalImage: compressed });
```

---

### 3. 延迟加载

只加载可见的历史记录：

```javascript
// 获取最近 20 条
const recent = await indexedDB.getRecentHistory(20);

// 用户滚动时加载更多
const loadMore = async (offset: number) => {
  const all = await indexedDB.getAllHistory();
  return all.slice(offset, offset + 20);
};
```

---

## 📈 监控与调试

### Chrome DevTools

1. 打开 DevTools (F12)
2. 切换到 **Application** 标签
3. 左侧选择 **Storage > IndexedDB > ParallelCameraDB**
4. 查看 **history** object store

### 查看数据
- 双击记录查看详细内容
- 右键删除单条记录
- 清空所有数据

### 性能分析

```javascript
// 测试保存性能
console.time('save-100-records');
for (let i = 0; i < 100; i++) {
  await indexedDB.saveHistory(mockResult);
}
console.timeEnd('save-100-records');

// 测试查询性能
console.time('query-all-records');
const all = await indexedDB.getAllHistory();
console.timeEnd('query-all-records');
```

---

## ✅ 迁移检查清单

完成以下步骤确保迁移成功：

- [ ] ✅ 旧数据已备份（如果需要）
- [ ] ✅ IndexedDB 工具已创建 (`/utils/indexedDB.ts`)
- [ ] ✅ 调试工具已创建 (`/utils/dbDebug.ts`)
- [ ] ✅ App.tsx 已更新为使用 IndexedDB
- [ ] ✅ 浏览器控制台能看到 `dbDebug` 对象
- [ ] ✅ 新照片能正常保存
- [ ] ✅ 历史记录能正常加载
- [ ] ✅ 删除功能正常
- [ ] ✅ Chrome DevTools 中能看到 IndexedDB 数据
- [ ] ✅ 测试离线访问历史记录
- [ ] ✅ 测试存储大量照片（50+）

---

## 🎉 完成！

现在你的**平行相机**应用拥有：

✅ **几乎无限的存储空间** - 数千张照片  
✅ **超快的加载速度** - 本地存储，零延迟  
✅ **完整的离线支持** - 无网络也能查看历史  
✅ **强大的调试工具** - 控制台实时监控  
✅ **灵活的查询功能** - 按模式、时间筛选  
✅ **数据导出功能** - 一键备份到 JSON  

---

## 📚 相关资源

- [MDN - IndexedDB API](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API)
- [IndexedDB 最佳实践](https://web.dev/indexeddb-best-practices/)
- [浏览器存储配额管理](https://web.dev/storage-for-the-web/)
