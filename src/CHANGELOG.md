# 📝 平行相机 - 更新日志

## 🚀 v2.0.0 - Mega 双重模式 (2025-01-16)

### ✨ 新功能

#### **🚀 Mega 双重模式**
- **一次拍摄，双倍快乐！** 同时生成写实和脑洞两个版本
- BeReal 风格双照片展示：
  - 主图：写实版全屏显示
  - 副图：脑洞版悬浮在右上角
  - 支持切换主副图显示
- 智能处理流程（5个步骤）：
  1. 分析照片
  2. 生成写实版本
  3. 构思创意元素
  4. 生成脑洞版本
  5. 完成
- 保存选项：
  - 一键保存全部（连续下载两张）
  - 分别下载写实版/脑洞版

#### **🎨 UI 升级**
- 新增渐变色设计（白色→黄色）用于 Mega 模式
- 🚀 火箭 emoji 作为 Mega 模式标识
- 拍照按钮支持渐变色外圈（Mega 模式）
- 三种模式按钮：写实 / 脑洞 / 🚀 双重

#### **📱 PWA 支持**
- 添加 Service Worker（离线缓存）
- 添加 manifest.json（可安装到主屏幕）
- 添加 PWA 工具函数（安装提示管理）
- 独立运行模式，竖屏锁定

---

### 🐛 Bug 修复

#### **图片生成问题**
- **问题：** 后端返回 `image`，前端期望 `imageUrl`
- **修复：** ProcessingView.tsx 第112行，改为 `generateData.image`
- **影响：** 现在拍照后会正常生成图片

#### **取景框裁剪问题**
- **问题：** 取景框显示的画面和实际拍出的照片不一致
- **原因：** `object-cover` 裁剪了视频，但拍照时捕获了完整画面
- **修复：** 
  - 计算 object-cover 的裁剪区域
  - 只捕获可见部分
  - 完美适配 iPhone 14 Plus (19.5:9 屏幕比例)
- **结果：** 所见即所得！

---

### 💅 优化改进

#### **结果展示 (ResultView)**
- 全屏展示生成的照片
- 可折叠的详情面板（上滑展开）
- Mega 模式专属：
  - BeReal 风格双照片对比
  - 分别显示两个版本的描述
  - 独立下载按钮

#### **首页历史 (HomePage)**
- 支持显示 Mega 模式记录
- Mega 模式卡片：写实版为主图，脑洞版在角落
- 渐变色图标背景（Mega 模式）
- 空状态展示三种模式：📸 / ✨ / 🚀

#### **拍摄界面 (CameraView)**
- 三按钮模式切换器
- 渐变色样式（Mega 模式）
- 更好的相机参数配置（16:9 比例）
- 所见即所得的取景框

#### **处理界面 (ProcessingView)**
- 步骤进度显示（Mega 模式：步骤 3/5）
- 渐变色加载动画（Mega 模式）
- 更清晰的状态文本

---

### 🔧 技术改进

#### **类型定义**
```typescript
export type GenerationMode = 'realistic' | 'creative' | 'mega';

export interface GeneratedResult {
  // ... 原有字段
  // Mega 模式新增字段：
  realisticImage?: string;
  creativeImage?: string;
  realisticDescription?: string;
  creativeDescription?: string;
}
```

#### **相机优化**
- 请求特定分辨率：1920x1080 @ 16:9
- 精确计算 object-cover 裁剪区域
- JPEG 质量提升至 95%

#### **PWA 集成**
- `/utils/pwa.ts` - PWA 工具函数
- `/public/manifest.json` - 应用清单
- `/public/sw.js` - Service Worker
- 自动注册和初始化

---

### 📦 新增文件

```
/components/
  ProcessingView.tsx (重写)
  ResultView.tsx (重写)
  HomePage.tsx (更新)
  CameraView.tsx (更新)

/utils/
  pwa.ts (新增)

/public/
  manifest.json (新增)
  sw.js (新增)
  icon-192.png (占位符 - 需要替换)
  icon-512.png (占位符 - 需要替换)

/
  QUICK-START.md (更新)
  PWA-SETUP.md (新增)
  CHANGELOG.md (新增)
```

---

### 🎯 完整功能矩阵

| 功能 | 写实模式 📸 | 脑洞模式 ✨ | 双重模式 🚀 |
|------|-----------|-----------|-----------|
| 分析照片 | ✅ | ✅ | ✅ |
| 生成写实版 | ✅ | ❌ | ✅ |
| 构思创意 | ❌ | ✅ | ✅ |
| 生成脑洞版 | ❌ | ✅ | ✅ |
| 原图参考 | ❌ | ✅ | ✅ |
| 双照片展示 | ❌ | ❌ | ✅ |
| 处理步骤 | 2 | 3 | 5 |

---

### 🎨 设计语言

**颜色方案：**
- 主背景：`#000000` (纯黑)
- 强调色：`#FFFC00` (亮黄)
- 次要色：`#FFFFFF` (纯白)
- Mega 渐变：`linear-gradient(to right, #FFFFFF, #FFFC00)`

**图标系统：**
- 📸 写实模式
- ✨ 脑洞模式（Sparkles）
- 🚀 双重模式（Rocket）

**风格参考：**
- Snapchat - 简洁直观
- BeReal - 真实对比
- 现代感 + 年轻化

---

### 📱 设备兼容性

**已测试：**
- ✅ iPhone 14 Plus (19.5:9 屏幕)
- ✅ 现代浏览器（Chrome, Safari）

**PWA 支持：**
- ✅ iOS Safari（添加到主屏幕）
- ✅ Android Chrome（自动安装提示）
- ⚠️ iOS 限制（无推送通知、后台同步）

---

### 🚀 性能指标

**处理时间估算：**
- 写实模式：~10-15秒
- 脑洞模式：~15-20秒
- **双重模式：~25-35秒** (两次图像生成)

**图片质量：**
- 捕获质量：95% JPEG
- 分辨率：基于相机传感器（通常 1920x1080）
- 裁剪：精确匹配显示区域

---

### 📚 文档更新

- ✅ `QUICK-START.md` - 快速开始指南（包含 Mega 模式）
- ✅ `PWA-SETUP.md` - PWA 详细配置说明
- ✅ `CHANGELOG.md` - 本文档

---

### 🎁 下一步建议

**必需：**
1. 生成应用图标（192x192, 512x512）
2. 部署到 Vercel 或其他支持 HTTPS 的平台
3. 真机测试 Mega 模式

**可选：**
1. 添加 loading 骨架屏
2. 实现照片编辑功能
3. 支持视频模式
4. 添加社交分享
5. 优化 Mega 模式处理速度（并行生成？）

---

## ⚡ v1.0.0 - 初始版本

### ✨ 核心功能
- 两种拍摄模式：写实 / 脑洞
- AI 图像分析（Gemini 2.0 Flash）
- AI 图像生成（Gemini 2.5 Flash Image）
- GPS 位置集成
- 历史记录系统
- Supabase 云端存储

### 🎨 UI 设计
- Snapchat + BeReal 风格
- 黑色背景 + 黄色强调色
- 简洁现代的交互

### 🔧 技术栈
- React + TypeScript
- Tailwind CSS v4.0
- Supabase Edge Functions
- Google Gemini AI

---

**Made with ❤️ and ✨**
