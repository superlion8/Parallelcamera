/**
 * IndexedDB 调试工具
 * 
 * 在浏览器控制台中使用：
 * import * as dbDebug from './utils/dbDebug';
 * 
 * // 查看统计信息
 * await dbDebug.showStats();
 * 
 * // 查看所有历史记录
 * await dbDebug.showAllHistory();
 * 
 * // 清空数据库
 * await dbDebug.clearAll();
 */

import * as indexedDB from './indexedDB';

/**
 * 显示数据库统计信息
 */
export async function showStats() {
  try {
    const stats = await indexedDB.getDatabaseStats();
    
    console.log('═══════════════════════════════════════');
    console.log('📊 平行相机 IndexedDB 统计信息');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('总记录数:', stats.totalCount);
    console.log('  ├─ 写实模式:', stats.realisticCount);
    console.log('  ├─ 脑洞模式:', stats.creativeCount);
    console.log('  └─ Meta模式:', stats.metaCount);
    console.log('');
    
    if (stats.newestTimestamp) {
      console.log('最新记录:', new Date(stats.newestTimestamp).toLocaleString('zh-CN'));
    }
    if (stats.oldestTimestamp) {
      console.log('最旧记录:', new Date(stats.oldestTimestamp).toLocaleString('zh-CN'));
    }
    
    console.log('');
    console.log('═══════════════════════════════════════');
    
    return stats;
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error);
    throw error;
  }
}

/**
 * 显示所有历史记录（简略版）
 */
export async function showAllHistory() {
  try {
    const history = await indexedDB.getAllHistory();
    
    console.log('═══════════════════════════════════════');
    console.log('📜 所有历史记录 (共', history.length, '条)');
    console.log('═══════════════════════════════════════');
    console.log('');
    
    history.forEach((item, index) => {
      const time = new Date(item.timestamp).toLocaleString('zh-CN');
      const mode = item.mode === 'realistic' ? '写实' : 
                   item.mode === 'creative' ? '脑洞' : 'Meta';
      const desc = item.description.substring(0, 30) + '...';
      
      console.log(`${index + 1}. [${mode}] ${time}`);
      console.log(`   ${desc}`);
      console.log(`   ID: ${item.id}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════');
    
    return history;
  } catch (error) {
    console.error('❌ 获取历史记录失败:', error);
    throw error;
  }
}

/**
 * 显示详细的历史记录（包含图片大小）
 */
export async function showDetailedHistory() {
  try {
    const history = await indexedDB.getAllHistory();
    
    console.log('═══════════════════════════════════════');
    console.log('📸 详细历史记录 (共', history.length, '条)');
    console.log('═══════════════════════════════════════');
    console.log('');
    
    let totalSize = 0;
    
    history.forEach((item, index) => {
      const time = new Date(item.timestamp).toLocaleString('zh-CN');
      const mode = item.mode === 'realistic' ? '写实' : 
                   item.mode === 'creative' ? '脑洞' : 'Meta';
      
      // 计算图片大小（Base64 编码）
      const originalSize = item.originalImage?.length || 0;
      const generatedSize = item.generatedImage?.length || 0;
      const realisticSize = item.realisticImage?.length || 0;
      const creativeSize = item.creativeImage?.length || 0;
      const itemTotalSize = originalSize + generatedSize + realisticSize + creativeSize;
      totalSize += itemTotalSize;
      
      console.log(`${index + 1}. [${mode}] ${time} - ID: ${item.id}`);
      console.log(`   描述: ${item.description.substring(0, 50)}...`);
      console.log(`   原图大小: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`   生成图大小: ${(generatedSize / 1024).toFixed(2)} KB`);
      if (realisticSize) {
        console.log(`   写实图大小: ${(realisticSize / 1024).toFixed(2)} KB`);
      }
      if (creativeSize) {
        console.log(`   脑洞图大小: ${(creativeSize / 1024).toFixed(2)} KB`);
      }
      console.log(`   小计: ${(itemTotalSize / 1024).toFixed(2)} KB`);
      
      if (item.location) {
        console.log(`   位置: ${item.location.latitude}, ${item.location.longitude}`);
      }
      
      console.log('');
    });
    
    console.log('═══════════════════════════════════════');
    console.log('总存储大小:', (totalSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('═══════════════════════════════════════');
    
    return { history, totalSize };
  } catch (error) {
    console.error('❌ 获取详细历史记录失败:', error);
    throw error;
  }
}

/**
 * 清空所有历史记录（需要二次确认）
 */
export async function clearAll() {
  const confirmText = '确认清空';
  
  console.warn('⚠️  警告：此操作将清空所有历史记录！');
  console.warn('⚠️  请在控制台输入以下命令确认：');
  console.warn(`⚠️  await dbDebug.confirmClear("${confirmText}")`);
  
  return false;
}

/**
 * 确认清空
 */
export async function confirmClear(confirmation: string) {
  if (confirmation !== '确认清空') {
    console.error('❌ 确认文本不正确');
    return false;
  }
  
  try {
    await indexedDB.clearAllHistory();
    console.log('✅ 所有历史记录已清空');
    return true;
  } catch (error) {
    console.error('❌ 清空历史记录失败:', error);
    throw error;
  }
}

/**
 * 删除指定 ID 的记录
 */
export async function deleteById(id: number) {
  try {
    await indexedDB.deleteHistory(id);
    console.log(`✅ 已删除 ID 为 ${id} 的记录`);
    return true;
  } catch (error) {
    console.error(`❌ 删除记录失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 查看指定 ID 的记录
 */
export async function viewById(id: number) {
  try {
    const item = await indexedDB.getHistoryById(id);
    
    if (!item) {
      console.error(`❌ 未找到 ID 为 ${id} 的记录`);
      return null;
    }
    
    console.log('═══════════════════════════════════════');
    console.log(`📸 记录详情 (ID: ${id})`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('时间:', new Date(item.timestamp).toLocaleString('zh-CN'));
    console.log('模式:', item.mode);
    console.log('描述:', item.description);
    
    if (item.creativeElement) {
      console.log('创意元素:', item.creativeElement);
    }
    
    if (item.location) {
      console.log('位置:', `${item.location.latitude}, ${item.location.longitude}`);
    }
    
    console.log('');
    console.log('原图 Base64 长度:', item.originalImage?.length || 0);
    console.log('生成图 Base64 长度:', item.generatedImage?.length || 0);
    
    if (item.mode === 'meta') {
      console.log('用户输入:', item.userPrompt);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════');
    
    return item;
  } catch (error) {
    console.error(`❌ 获取记录失败 (ID: ${id}):`, error);
    throw error;
  }
}

/**
 * 导出所有历史记录为 JSON
 */
export async function exportToJSON() {
  try {
    const history = await indexedDB.getAllHistory();
    const json = JSON.stringify(history, null, 2);
    
    // 创建下载链接
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parallel-camera-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ 历史记录已导出为 JSON 文件');
    console.log('   记录数:', history.length);
    console.log('   文件大小:', (json.length / 1024 / 1024).toFixed(2), 'MB');
    
    return history;
  } catch (error) {
    console.error('❌ 导出失败:', error);
    throw error;
  }
}

/**
 * 帮助信息
 */
export function help() {
  console.log('═══════════════════════════════════════');
  console.log('🛠️  平行相机 IndexedDB 调试工具');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('使用方法：');
  console.log('');
  console.log('1. 查看统计信息：');
  console.log('   await dbDebug.showStats()');
  console.log('');
  console.log('2. 查看所有记录（简略）：');
  console.log('   await dbDebug.showAllHistory()');
  console.log('');
  console.log('3. 查看详细记录（含大小）：');
  console.log('   await dbDebug.showDetailedHistory()');
  console.log('');
  console.log('4. 查看指定记录：');
  console.log('   await dbDebug.viewById(1)');
  console.log('');
  console.log('5. 删除指定记录：');
  console.log('   await dbDebug.deleteById(1)');
  console.log('');
  console.log('6. 导出为 JSON：');
  console.log('   await dbDebug.exportToJSON()');
  console.log('');
  console.log('7. 清空所有记录：');
  console.log('   await dbDebug.clearAll()');
  console.log('   await dbDebug.confirmClear("确认清空")');
  console.log('');
  console.log('═══════════════════════════════════════');
}

// 自动显示帮助
if (typeof window !== 'undefined') {
  (window as any).dbDebug = {
    help,
    showStats,
    showAllHistory,
    showDetailedHistory,
    viewById,
    deleteById,
    clearAll,
    confirmClear,
    exportToJSON,
  };
  
  console.log('💡 IndexedDB 调试工具已加载！输入 dbDebug.help() 查看使用说明');
}
