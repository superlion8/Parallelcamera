# 🔧 IndexedDB 版本冲突修复

## ❌ 原始错误

```
IndexedDB 打开失败: VersionError: The requested version (1) is less than the existing version (2).
Error loading history: VersionError: The requested version (1) is less than the existing version (2).
```

---

## 🔍 问题原因

### **版本冲突**

两个文件使用了不同的 IndexedDB 版本号：

| 文件 | 版本号 | 问题 |
|------|--------|------|
| `/utils/characterDB.ts` | `DB_VERSION = 2` | ✅ 正确 |
| `/utils/indexedDB.ts` | `DB_VERSION = 1` | ❌ 过时 |

### **为什么会冲突？**

1. **`characterDB.ts` 先运行**（用户打开角色管理）
   - 创建数据库版本 2
   - 包含 `history` 和 `characters` 两个 store

2. **`indexedDB.ts` 后运行**（加载历史记录）
   - 尝试打开版本 1
   - ❌ IndexedDB 不允许降级版本
   - 抛出 `VersionError`

---

## ✅ 解决方案

### **统一版本号到 2**

修改 `/utils/indexedDB.ts`：

```typescript
// 修改前
const DB_VERSION = 1;

// 修改后
const DB_VERSION = 2; // 升级到版本 2 以支持 characters store
```

---

## 🔧 完整修复

### **1. 更新数据库版本**

```typescript
const DB_NAME = 'ParallelCameraDB';
const DB_VERSION = 2; // ← 从 1 升级到 2
const STORE_NAME = 'history';
const CHARACTERS_STORE = 'characters'; // ← 新增常量
```

---

### **2. 更新 `onupgradeneeded` 处理**

确保两个 store 都能正确创建：

```typescript
request.onupgradeneeded = (event) => {
  console.log('IndexedDB 升级/创建中，版本:', event.oldVersion, '->', event.newVersion);
  const db = (event.target as IDBOpenDBRequest).result;

  // 创建 history store（如果不存在）
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    const objectStore = db.createObjectStore(STORE_NAME, {
      keyPath: 'id',
      autoIncrement: true,
    });
    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
    objectStore.createIndex('mode', 'mode', { unique: false });
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
```

---

### **3. 添加 `characterName` 字段**

更新 `GeneratedResult` 类型：

```typescript
export interface GeneratedResult {
  id?: number;
  description: string;
  generatedImage: string;
  originalImage: string;
  location?: { latitude: number; longitude: number };
  mode: 'realistic' | 'creative' | 'mega';
  creativeElement?: string;
  realisticImage?: string;
  creativeImage?: string;
  realisticDescription?: string;
  creativeDescription?: string;
  timestamp: number;
  characterName?: string; // ← 新增：使用的角色名字
}
```

---

## 📊 数据库结构

### **ParallelCameraDB - 版本 2**

```
ParallelCameraDB (v2)
├── history (Object Store)
│   ├── id (keyPath, autoIncrement)
│   ├── timestamp (index)
│   ├── mode (index)
│   ├── description
│   ├── generatedImage
│   ├── originalImage
│   ├── location?
│   ├── creativeElement?
│   ├── realisticImage?
│   ├── creativeImage?
│   ├── realisticDescription?
│   ├── creativeDescription?
│   └── characterName? ← 新增
│
└── characters (Object Store)
    ├── id (keyPath, autoIncrement)
    ├── name (index)
    ├── createdAt (index)
    ├── usageCount (index)
    ├── referenceImage
    ├── description?
    └── lastUsedAt?
```

---

## 🔄 版本升级流程

### **从版本 0 → 版本 2**

```
用户首次访问
↓
indexedDB.open('ParallelCameraDB', 2)
↓
onupgradeneeded: oldVersion = 0, newVersion = 2
↓
创建 history store
创建 characters store
↓
数据库创建成功
```

### **从版本 1 → 版本 2**

```
用户已有版本 1 的数据
↓
indexedDB.open('ParallelCameraDB', 2)
↓
onupgradeneeded: oldVersion = 1, newVersion = 2
↓
history store 已存在（保留）
创建 characters store（新增）
↓
数据库升级成功
```

---

## ✅ 修复验证

### **1. 检查控制台日志**

成功时应该看到：

```
IndexedDB 升级/创建中，版本: 1 -> 2
Characters store 创建成功
IndexedDB 打开成功
```

### **2. 检查数据库**

在浏览器开发者工具 → Application → IndexedDB：

```
ParallelCameraDB
├── history (Object Store)
└── characters (Object Store) ← 新增
```

### **3. 测试功能**

- ✅ 加载历史记录正常
- ✅ 保存新记录正常
- ✅ 创建角色正常
- ✅ 选择角色正常
- ✅ 无版本冲突错误

---

## 🛡️ 防止未来冲突

### **规则**

1. **所有访问同一数据库的文件必须使用相同的版本号**
2. **版本号只能增加，不能减少**
3. **`onupgradeneeded` 必须处理所有 store 的创建**

### **当前状态**

| 文件 | 版本号 | Store | 状态 |
|------|--------|-------|------|
| `/utils/indexedDB.ts` | 2 | history | ✅ |
| `/utils/characterDB.ts` | 2 | characters | ✅ |

---

## 📝 注意事项

### **1. 数据不会丢失**

- IndexedDB 升级时会**保留**所有现有数据
- 只会添加新的 store
- 版本 1 的 `history` 数据完全保留

### **2. 向后兼容**

```typescript
// 检查 store 是否存在再创建
if (!db.objectStoreNames.contains(STORE_NAME)) {
  // 创建 store
}
```

这确保了：
- 新用户：创建所有 store
- 老用户：只创建缺失的 store

### **3. 开发环境清理**

如果需要重置数据库：

```javascript
// 在浏览器控制台运行
indexedDB.deleteDatabase('ParallelCameraDB');
location.reload();
```

---

## 🎯 总结

### **修复内容**

| 项目 | 修改 | 结果 |
|------|------|------|
| 版本号 | 1 → 2 | ✅ 统一版本 |
| Store 创建 | 单独 → 统一 | ✅ 完整支持 |
| 类型定义 | 添加 characterName | ✅ 类型安全 |

### **修复后**

✅ IndexedDB 正常工作  
✅ 历史记录正常加载  
✅ 角色系统正常运行  
✅ 没有版本冲突错误  

---

## 🔍 排查清单

如果仍有问题，检查：

- [ ] 刷新浏览器（F5 或 Cmd+R）
- [ ] 清除浏览器缓存
- [ ] 检查控制台是否有其他错误
- [ ] 确认两个文件都使用 `DB_VERSION = 2`
- [ ] 检查 IndexedDB 浏览器支持

---

🎉 **问题已解决！IndexedDB 版本冲突已修复。**
