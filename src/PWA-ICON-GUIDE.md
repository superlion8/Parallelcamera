# 📱 平行相机 PWA 图标设置指南

## 🎨 快速生成图标

### 方法 1: 使用在线生成器（推荐）

1. 部署项目到 Vercel
2. 访问 `https://your-app.vercel.app/generate-icons.html`
3. 点击按钮下载三种尺寸的图标：
   - ✅ `icon-192.png` (192×192) - Android 标准尺寸
   - ✅ `icon-512.png` (512×512) - Android 高清尺寸
   - ✅ `apple-touch-icon.png` (180×180) - iOS 专用图标

4. 将下载的图标文件保存到项目的 `/public` 目录
5. 重新部署到 Vercel

---

### 方法 2: 本地开发环境

在本地开发时：

```bash
# 启动开发服务器
npm run dev

# 访问图标生成器
open http://localhost:5173/generate-icons.html
```

下载图标并保存到 `/public` 目录。

---

## 📋 文件清单

确保 `/public` 目录包含以下文件：

```
/public
├── icon-192.png          ← Android 标准图标
├── icon-512.png          ← Android 高清图标
├── apple-touch-icon.png  ← iOS 专用图标
├── icon.svg              ← 矢量图标源文件（可选）
├── manifest.json         ← PWA 配置文件
└── sw.js                 ← Service Worker
```

---

## ✅ 检查配置

### 1. manifest.json 配置

确保 `/public/manifest.json` 包含图标引用：

```json
{
  "name": "平行相机 - Parallel Camera",
  "short_name": "平行相机",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2. HTML Head 配置（自动配置）

`PWAHead.tsx` 组件会自动设置以下 meta 标签：

```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="icon" href="/icon-192.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#FFFC00">
<meta name="apple-mobile-web-app-capable" content="yes">
```

✅ **无需手动配置，已自动完成！**

---

## 📱 测试 PWA 图标

### iOS (Safari)

1. 在 iPhone 上访问部署的应用
2. 点击底部分享按钮 📤
3. 选择 **"添加到主屏幕"**
4. 确认应用名称为 **"平行相机"**
5. 点击 **"添加"**

✅ **图标应该显示黑底的双镜片 logo（白色+黄色）**

---

### Android (Chrome)

1. 在 Android 设备上访问部署的应用
2. 点击菜单 ⋮
3. 选择 **"安装应用"** 或 **"添加到主屏幕"**
4. 确认应用名称为 **"平行相机"**
5. 点击 **"安装"**

✅ **图标应该显示黑底的双镜片 logo**

---

### 桌面端 (Chrome/Edge)

1. 访问部署的应用
2. 地址栏右侧会显示安装图标 ➕
3. 点击 **"安装平行相机"**
4. 确认安装

✅ **桌面图标和应用窗口都会显示 logo**

---

## 🎨 图标设计说明

### Logo 构成

```
┌─────────────────────────┐
│  ⚪ 白色镜片 (现实世界)   │
│   ╲                     │
│    ╲                    │
│     ╲ ← 虚线连接         │
│      ╲                  │
│       🟡 黄色镜片 (平行世界) │
│         ✨ 闪光效果      │
│                         │
│    黑色背景 (#000000)    │
└─────────────────────────┘
```

### 颜色规范

- **背景**: `#000000` (纯黑)
- **主镜片**: `#FFFFFF` (纯白)
- **强调色**: `#FFFC00` (荧光黄)
- **透明度**: 30-40% 用于内圈填充

---

## 🔧 自定义图标

如果需要修改图标设计：

### 编辑 SVG 源文件

1. 打开 `/public/icon.svg`
2. 使用 Figma/Sketch/Illustrator 编辑
3. 保存后重新访问 `/generate-icons.html`
4. 下载新图标并替换 `/public` 中的文件

### 编辑生成器代码

修改 `/public/generate-icons.html` 中的 `drawLogo()` 函数：

```javascript
function drawLogo(canvas, size) {
  const ctx = canvas.getContext('2d');
  
  // 修改这里的绘制逻辑
  // ...
}
```

---

## 📊 图标尺寸对照表

| 平台 | 尺寸 | 文件名 | 用途 |
|------|------|--------|------|
| Android | 192×192 | `icon-192.png` | 标准图标 |
| Android | 512×512 | `icon-512.png` | 高清图标 / Splash Screen |
| iOS | 180×180 | `apple-touch-icon.png` | 主屏幕图标 |
| iOS | 167×167 | `apple-touch-icon.png` | iPad Pro |
| Favicon | 32×32 | `favicon.ico` | 浏览器标签（可选）|

---

## 🚀 部署后验证

### 使用 Lighthouse 检查

1. 在 Chrome 中打开部署的应用
2. 按 F12 打开开发者工具
3. 切换到 **Lighthouse** 标签
4. 选择 **Progressive Web App**
5. 点击 **Generate report**

✅ **应该通过所有 PWA 图标检查项**

### 手动验证清单

- [ ] 访问 `/manifest.json` 确认图标路径正确
- [ ] 访问 `/icon-192.png` 确认图标可访问
- [ ] 访问 `/icon-512.png` 确认图标可访问
- [ ] 访问 `/apple-touch-icon.png` 确认图标可访问
- [ ] 在移动设备上添加到主屏幕
- [ ] 确认主屏幕图标显示正确
- [ ] 确认启动时 Splash Screen 显示正确（Android）
- [ ] 确认应用名称为 "平行相机"

---

## 🐛 常见问题

### Q: iOS 上图标不显示？

**A:** 检查以下几点：
1. `apple-touch-icon.png` 文件是否存在于 `/public` 目录
2. 文件大小是否为 180×180 像素
3. 清除 Safari 缓存并重新添加到主屏幕
4. 确保文件格式为 PNG（不支持 SVG）

### Q: Android 上图标被裁剪？

**A:** 使用 `maskable` 图标：
1. 确保 logo 主体在安全区域内（中心 80%）
2. 在 `manifest.json` 中添加 `"purpose": "maskable"`
3. 重新生成图标时留出足够的内边距

### Q: 图标边缘有白边？

**A:** 确保背景设置为黑色：
```javascript
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, size, size);
```

### Q: 更新图标后不生效？

**A:** 清除缓存：
1. 卸载旧的 PWA 应用
2. 清除浏览器缓存
3. 重新访问网站
4. 重新添加到主屏幕

---

## 📚 相关文档

- [PWA 安装指南](./PWA-SETUP.md)
- [Manifest 规范](https://web.dev/add-manifest/)
- [Apple Touch Icon 规范](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)

---

## ✨ 完成！

按照以上步骤操作后，你的 **平行相机** 应用将拥有：

✅ **完美的主屏幕图标** - iOS/Android 都能正确显示  
✅ **专业的品牌视觉** - 黑底双镜片设计  
✅ **原生应用体验** - 启动画面、主题色统一  
✅ **PWA 最佳实践** - 通过所有 Lighthouse 检查

🎉 **现在你的应用看起来就像原生 App 一样！**
