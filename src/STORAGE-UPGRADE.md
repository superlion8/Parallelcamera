# ⚡ 存储升级 - 快速参考

## 🎯 改进内容

### 之前 ❌
```
存储方式: Supabase KV (服务器)
数量限制: 50 条
性能:     需要网络请求
离线:     不可用
```

### 现在 ✅
```
存储方式: IndexedDB (浏览器本地)
数量限制: 数千条（50MB - 几个GB）
性能:     本地存储，即时响应
离线:     完全可用
```

---

## 🚀 快速开始

### 1. 正常使用（自动）

应用已自动升级，无需任何操作！

```bash
npm run dev
# 拍照 → 生成 → 自动保存到 IndexedDB
```

---

### 2. 调试工具（开发模式）

打开浏览器控制台 (F12)：

```javascript
// 查看帮助
dbDebug.help()

// 查看统计
await dbDebug.showStats()

// 查看所有记录
await dbDebug.showAllHistory()

// 查看详细信息（含图片大小）
await dbDebug.showDetailedHistory()

// 导出为 JSON
await dbDebug.exportToJSON()
```

---

### 3. 查看存储数据

**Chrome DevTools:**
1. F12 打开开发者工具
2. Application 标签
3. Storage > IndexedDB > ParallelCameraDB
4. 查看 **history** object store

---

## 📊 容量对比

| 场景 | localStorage (旧) | IndexedDB (新) |
|------|-------------------|----------------|
| 单张照片 | ~300 KB | ~300 KB |
| 最多存储 | 约 30 张 | **数千张** ✨ |
| Mega 模式 | 约 15 张 | **数千张** ✨ |
| 总容量 | 5-10 MB | **50 MB - 几个 GB** 🚀 |

---

## 🛠️ 常用命令

```javascript
// 统计信息
await dbDebug.showStats()

// 查看记录（简略）
await dbDebug.showAllHistory()

// 查看记录（详细）
await dbDebug.showDetailedHistory()

// 查看指定记录
await dbDebug.viewById(1)

// 删除指定记录
await dbDebug.deleteById(1)

// 导出备份
await dbDebug.exportToJSON()

// 清空所有（需要确认）
await dbDebug.clearAll()
await dbDebug.confirmClear("确认清空")
```

---

## ✅ 功能测试

### 测试清单

- [ ] 拍摄新照片能正常保存
- [ ] 首页能看到历史记录
- [ ] 删除功能正常
- [ ] 离线状态下能查看历史
- [ ] Chrome DevTools 能看到 IndexedDB 数据
- [ ] 控制台有 `dbDebug` 对象（开发模式）

---

## 🐛 常见问题

### Q: 旧的历史记录还在吗？

**A:** 如果你之前使用了服务器存储，旧数据仍在服务器上。新数据保存在本地 IndexedDB。

**迁移方法：** 参考 [INDEXEDDB-MIGRATION.md](./INDEXEDDB-MIGRATION.md)

---

### Q: 清除浏览器缓存会丢失数据吗？

**A:** 会的。IndexedDB 数据存储在浏览器本地，清除浏览器数据会删除历史记录。

**解决方案：** 
```javascript
// 定期备份
await dbDebug.exportToJSON()
```

---

### Q: 隐私模式下能用吗？

**A:** 可以用，但关闭隐私窗口后数据会消失。

---

### Q: 存储空间满了怎么办？

**A:** 
```javascript
// 查看详细统计
await dbDebug.showDetailedHistory()

// 删除旧记录
await dbDebug.deleteById(1)

// 或批量删除（手动）
const all = await indexedDB.getAllHistory();
for (const item of all.slice(100)) {
  await indexedDB.deleteHistory(item.id);
}
```

---

### Q: 怎么查看使用了多少存储空间？

**A:**
```javascript
// 浏览器存储配额
if (navigator.storage?.estimate) {
  const { usage, quota } = await navigator.storage.estimate();
  console.log('已使用:', (usage / 1024 / 1024).toFixed(2), 'MB');
  console.log('总配额:', (quota / 1024 / 1024).toFixed(2), 'MB');
}

// IndexedDB 数据大小
await dbDebug.showDetailedHistory()
// 查看最后一行 "总存储大小"
```

---

## 📚 完整文档

更多细节查看：
- 📘 [IndexedDB 迁移详细说明](./INDEXEDDB-MIGRATION.md)

---

## 🎉 完成！

现在你的应用可以存储**数千张照片**了！🚀✨

**核心改进：**
- ✅ 存储容量提升 100+ 倍
- ✅ 加载速度提升（本地存储）
- ✅ 完整离线支持
- ✅ 强大的调试工具
