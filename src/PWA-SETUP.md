# 📱 平行相机 PWA 设置指南

## ✅ 已完成的配置

### 1. **Manifest 文件** (`/public/manifest.json`)
- ✅ 应用名称、图标、主题色
- ✅ 独立运行模式（standalone）
- ✅ 竖屏显示（portrait）

### 2. **Service Worker** (`/public/sw.js`)
- ✅ 离线缓存支持
- ✅ 资源预加载
- ✅ 自动更新机制

### 3. **PWA 工具** (`/utils/pwa.ts`)
- ✅ Service Worker 注册
- ✅ 安装提示管理
- ✅ PWA 检测

### 4. **App 集成** (`/App.tsx`)
- ✅ 自动注册 Service Worker
- ✅ 启动时初始化 PWA 功能

---

## 🎨 需要完成的图标

你需要创建以下尺寸的应用图标，并替换 `/public/` 目录中的文件：

### **必需图标：**
- `icon-192.png` - 192x192 像素
- `icon-512.png` - 512x512 像素

### **可选图标（提升体验）：**
- `icon-72.png` - 72x72
- `icon-96.png` - 96x96
- `icon-128.png` - 128x128
- `icon-144.png` - 144x144
- `icon-152.png` - 152x152
- `icon-384.png` - 384x384

### **推荐工具生成图标：**

1. **在线生成器：**
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://favicon.io/

2. **设计建议：**
   - 使用简单、醒目的图标
   - 黑色背景 + 黄色元素（符合品牌色 #FFFC00）
   - 可以用相机图标 📸 或闪电 ⚡ 作为主要元素
   - 确保在小尺寸下清晰可辨

---

## 📲 如何在手机上安装 PWA

### **iOS (Safari):**

1. 用 Safari 浏览器打开你的网站
2. 点击底部中间的「分享」按钮
3. 滑动找到「添加到主屏幕」
4. 点击「添加」
5. 应用图标出现在主屏幕上！

**注意：** 
- iOS 只支持 Safari 安装 PWA
- Chrome/Firefox 无法安装

### **Android (Chrome):**

1. 用 Chrome 浏览器打开你的网站
2. 点击右上角菜单（三个点）
3. 选择「添加到主屏幕」或「安装应用」
4. 点击「安装」
5. 应用图标出现在主屏幕上！

**或者自动弹窗：**
- Android Chrome 会自动显示「添加到主屏幕」横幅
- 点击横幅即可安装

---

## 🔧 开发环境测试

### **在本地测试 PWA：**

```bash
# 1. 构建应用
npm run build

# 2. 用 HTTPS 服务器运行（PWA 需要 HTTPS）
npx serve -s dist -l 3000

# 3. 用手机访问（确保电脑和手机在同一 WiFi）
# 访问：https://<你的电脑IP>:3000
```

### **Chrome DevTools 调试：**

1. 打开 Chrome DevTools (F12)
2. 切换到 **Application** 标签
3. 查看：
   - **Manifest** - 检查 manifest.json 配置
   - **Service Workers** - 查看 SW 状态
   - **Storage** - 查看缓存内容

---

## 🚀 部署到生产环境

### **重要提示：**

PWA **必须运行在 HTTPS** 环境下！

### **推荐部署平台（免费 + HTTPS）：**

1. **Vercel** ⭐ 推荐
   ```bash
   npm install -g vercel
   vercel deploy
   ```
   - 自动 HTTPS
   - 全球 CDN
   - 零配置

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **GitHub Pages**
   - 需要配置自定义域名才能支持 HTTPS

4. **Cloudflare Pages**
   - 自动 HTTPS
   - 快速全球分发

---

## ✨ PWA 功能清单

- ✅ 离线访问（缓存静态资源）
- ✅ 添加到主屏幕
- ✅ 独立窗口运行（无浏览器地址栏）
- ✅ 竖屏锁定
- ✅ 启动画面（splash screen）
- ⚠️ 推送通知（需要额外配置）
- ⚠️ 后台同步（需要额外配置）

---

## 🐛 常见问题

### **Q: 为什么安装按钮不显示？**
A: 检查：
- 是否使用 HTTPS
- manifest.json 是否正确加载
- Service Worker 是否注册成功
- 是否已经安装过

### **Q: 图标不显示？**
A: 确保图标文件存在且路径正确：
- `/public/icon-192.png`
- `/public/icon-512.png`

### **Q: iOS 上功能受限？**
A: 是的，iOS Safari 对 PWA 支持有限：
- 不支持推送通知
- 不支持后台同步
- 缓存限制较严格

### **Q: 如何更新 PWA？**
A: 
- 修改 `/public/sw.js` 中的 `CACHE_NAME`
- 用户刷新页面时会自动更新

---

## 📖 进一步优化

### **性能优化：**
- 添加更多资源到缓存列表
- 实现离线回退页面
- 优化图片加载

### **用户体验：**
- 添加「安装应用」引导提示
- 检测更新并提示用户刷新
- 添加离线提示

### **代码示例 - 添加安装按钮：**

```tsx
import { showInstallPrompt, isInstallPromptAvailable } from './utils/pwa';

function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    setCanInstall(isInstallPromptAvailable());
  }, []);

  if (!canInstall) return null;

  return (
    <button onClick={showInstallPrompt}>
      安装应用
    </button>
  );
}
```

---

## 📞 需要帮助？

如果遇到问题，可以检查：
1. 浏览器控制台的错误信息
2. Chrome DevTools → Application → Manifest
3. Chrome DevTools → Application → Service Workers

---

**现在你的应用已经是 PWA 了！🎉**

用户可以把它安装到手机主屏幕，像原生 App 一样使用！
