import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './utils/supabase/client';
import { HomePage } from './components/HomePage';
import { CameraView } from './components/CameraView';
import { MetaPromptView } from './components/MetaPromptView';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';
import { PWAHead } from './components/PWAHead';
import { registerServiceWorker, setupInstallPrompt } from './utils/pwa';
import * as indexedDB from './utils/indexedDB';
import type { Character } from './utils/characterDB';

// 开发环境下加载调试工具
if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  import('./utils/dbDebug').then((dbDebug) => {
    (window as any).dbDebug = dbDebug;
    console.log('💡 IndexedDB 调试工具已加载！输入 dbDebug.help() 查看使用说明');
  }).catch(err => {
    console.error('Failed to load debug tools:', err);
  });
}

export type AppState = 'home' | 'camera' | 'metaPrompt' | 'processing' | 'result';
export type GenerationMode = 'realistic' | 'creative' | 'meta'; // 写实 | 脑洞 | Meta

export interface CapturedData {
  image: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
  mode: GenerationMode; // Add mode to captured data
  character?: Character; // 选中的角色（可选）
  userPrompt?: string; // Meta 模式的用户输入
}

export interface GeneratedResult {
  description: string;
  generatedImage: string;
  originalImage: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  mode: GenerationMode;
  creativeElement?: string; // For creative mode
  // For meta mode - store both results
  realisticImage?: string;
  creativeImage?: string;
  realisticDescription?: string;
  creativeDescription?: string;
  timestamp?: number;
  id?: number; // IndexedDB ID
  characterName?: string; // 使用的角色名字（用于显示）
  userPrompt?: string; // Meta 模式的用户输入
}

const HISTORY_KEY = 'parallel-camera-history';

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 1. Initial Session Check (Crucial for OAuth callback)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error checking initial session:', error);
      } else if (session) {
        console.log('Initial session found:', session.user.email);
        setSession(session);
        // Clean URL if we have a session (likely from OAuth)
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        console.log('No initial session.');
      }
    });

    // 2. Subscribe to Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth State Changed:', _event, session);
      
      // ALWAYS update session state, whether it's null or a valid session
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    console.log('Starting Google login...');
    
    // Check LocalStorage support
    try {
      window.localStorage.setItem('supabase.auth.test', 'ok');
      window.localStorage.removeItem('supabase.auth.test');
    } catch (e) {
      alert('您的浏览器似乎禁用了 LocalStorage，这会导致登录失败。请检查隐私设置。');
      return;
    }

    // 使用当前页面 origin 作为 redirect URL（不带路径）
    const redirectUrl = window.location.origin;
    console.log('Redirect URL:', redirectUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    if (error) {
      console.error('Login error:', error);
      alert('登录失败: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Register PWA service worker
  useEffect(() => {
    registerServiceWorker();
    setupInstallPrompt();
  }, []);

  // Load history from IndexedDB on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      console.log('Loading history from IndexedDB...');
      const data = await indexedDB.getAllHistory();
      console.log('History loaded:', data.length, 'items');
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToHistory = async (newResult: GeneratedResult) => {
    try {
      console.log('Saving to history...');
      const id = await indexedDB.saveHistory(newResult);
      console.log('History saved successfully with ID:', id);
      // Reload history from IndexedDB
      await loadHistory();
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const deleteFromHistory = async (index: number) => {
    try {
      console.log('Deleting history item at index:', index);
      const id = history[index]?.id;
      if (id) {
        await indexedDB.deleteHistory(id);
        console.log('History deleted successfully');
        // Reload history from IndexedDB
        await loadHistory();
      } else {
        console.error('Failed to delete history: ID not found');
      }
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  };

  const handleStartCamera = () => {
    // 需要登录才能使用相机
    if (!session) {
      handleLogin();
      return;
    }
    setAppState('camera');
  };

  const handleCapture = (data: CapturedData) => {
    setCapturedData(data);
    // Meta 模式先进入 prompt 输入界面
    if (data.mode === 'meta') {
      setAppState('metaPrompt');
    } else {
      setAppState('processing');
    }
  };

  const handleMetaPromptConfirm = (dataWithPrompt: CapturedData) => {
    setCapturedData(dataWithPrompt);
    setAppState('processing');
  };

  const handleProcessingComplete = async (generatedResult: GeneratedResult) => {
    setResult(generatedResult);
    setAppState('result');
    
    // Save to history
    await saveToHistory(generatedResult);
  };

  const handleReset = () => {
    setCapturedData(null);
    setResult(null);
    setAppState('home');
  };

  if (isLoadingHistory) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden">
      <PWAHead />
      {appState === 'home' && (
        <HomePage 
          onStartCamera={handleStartCamera}
          history={history}
          onDeleteHistory={deleteFromHistory}
          session={session}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}
      {appState === 'camera' && (
        <CameraView 
          onCapture={handleCapture}
          onBack={handleReset}
        />
      )}
      {appState === 'metaPrompt' && capturedData && (
        <MetaPromptView
          capturedData={capturedData}
          onConfirm={handleMetaPromptConfirm}
          onBack={() => setAppState('camera')}
        />
      )}
      {appState === 'processing' && capturedData && (
        <ProcessingView 
          capturedData={capturedData} 
          onComplete={handleProcessingComplete}
          onCancel={handleReset}
        />
      )}
      {appState === 'result' && result && (
        <ResultView 
          result={result} 
          onReset={handleReset}
        />
      )}
    </div>
  );
}
