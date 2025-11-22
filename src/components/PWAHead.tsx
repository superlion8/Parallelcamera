import { useEffect } from 'react';

export function PWAHead() {
  useEffect(() => {
    // 设置文档标题
    document.title = '平行相机 - Parallel Camera';

    // 创建或更新 meta 标签的辅助函数
    const setMeta = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // 创建或更新 link 标签
    const setLink = (rel: string, href: string, sizes?: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (sizes) {
        link.setAttribute('sizes', sizes);
      }
    };

    // PWA 基础 Meta 标签
    setMeta('application-name', '平行相机');
    setMeta('apple-mobile-web-app-title', '平行相机');
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('mobile-web-app-capable', 'yes');
    setMeta('theme-color', '#FFFC00');
    setMeta('description', '用AI创造平行世界的照片 - 写实模式、脑洞模式、Meta模式');
    
    // iOS Meta 标签
    setMeta('format-detection', 'telephone=no');
    
    // Open Graph / Social Media
    setMeta('og:title', '平行相机 - Parallel Camera', true);
    setMeta('og:description', '用AI创造平行世界的照片', true);
    setMeta('og:type', 'website', true);
    setMeta('og:image', '/icon-512.png', true);
    
    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', '平行相机 - Parallel Camera');
    setMeta('twitter:description', '用AI创造平行世界的照片');
    setMeta('twitter:image', '/icon-512.png');

    // Apple Touch Icons (多种尺寸)
    setLink('apple-touch-icon', '/apple-touch-icon.png', '180x180');
    setLink('icon', '/icon-192.png', '192x192');
    setLink('icon', '/icon-512.png', '512x512');
    
    // Manifest
    setLink('manifest', '/manifest.json');

    // Viewport (如果不存在)
    if (!document.querySelector('meta[name="viewport"]')) {
      setMeta('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }

  }, []);

  return null; // 这个组件不渲染任何内容
}
