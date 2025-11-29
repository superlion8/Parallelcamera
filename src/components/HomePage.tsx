import { useState } from 'react';
import { Camera, Trash2, MapPin, X, Sparkles, Zap, Users, LogIn, LogOut } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { GeneratedResult } from '../App';
import { Logo } from './Logo';
import { CharacterManager } from './CharacterManager';

interface HomePageProps {
  onStartCamera: () => void;
  history: GeneratedResult[];
  onDeleteHistory: (index: number) => void;
  session: Session | null;
  onLogin: () => void;
  onLogout: () => void;
}

export function HomePage({ onStartCamera, history, onDeleteHistory, session, onLogin, onLogout }: HomePageProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCharacterManager, setShowCharacterManager] = useState(false);

  const handleStartClick = () => {
    if (session) {
      onStartCamera();
    } else {
      onLogin();
    }
  };

  return (
    <div className="h-full w-full bg-black overflow-y-auto">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo size="sm" showText={false} />
          <div className="flex items-center gap-2">
            {session && (
              <>
                <button
                  onClick={onLogout}
                  className="p-2 bg-white/10 text-white rounded-full active:scale-95 transition-transform hover:bg-white/20"
                  title="登出"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCharacterManager(true)}
                  className="px-3 py-2 bg-white/10 text-white rounded-full active:scale-95 transition-transform flex items-center gap-2 border border-white/20 hover:bg-white/20"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">角色</span>
                </button>
              </>
            )}
            {/* Camera/Login Button */}
            <button
              onClick={handleStartClick}
              className={`px-4 py-2 ${session ? 'bg-[#FFFC00] text-black' : 'bg-white text-black'} font-bold rounded-full active:scale-95 transition-transform flex items-center gap-2`}
            >
              {session ? <Camera className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{session ? '拍摄' : '登录'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {history.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            {/* Brand Logo */}
            <Logo size="lg" className="mb-8" />
            
            <h2 className="text-white text-2xl font-bold mb-3 font-display">
              欢迎来到平行世界
            </h2>
            <p className="text-white/60 mb-8 max-w-xs">
              {session ? '拍摄一张照片，让AI为你创造一个平行宇宙' : '请先登录以开始您的平行宇宙之旅'}
            </p>
            
            <button
              onClick={handleStartClick}
              className={`px-8 py-4 ${session ? 'bg-[#FFFC00] text-black' : 'bg-white text-black'} font-bold rounded-full active:scale-95 transition-transform text-lg flex items-center gap-2`}
            >
              {!session && <LogIn className="w-5 h-5" />}
              {session ? '开始拍摄' : '使用 Google 登录'}
            </button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-md w-full">
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">📸</div>
                <div className="text-white/80 text-xs font-medium">写实模式</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">✨</div>
                <div className="text-white/80 text-xs font-medium">脑洞模式</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">⚡</div>
                <div className="text-white/80 text-xs font-medium">Meta 模式</div>
              </div>
            </div>

          </div>
        ) : (
          /* Feed - BeReal style */
          <div className="space-y-6 pb-6">
            {history.map((item, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-2xl overflow-hidden active:bg-white/10 transition-colors"
                onClick={() => setSelectedIndex(index)}
              >
                {/* User info bar */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.mode === 'meta' 
                        ? 'bg-gradient-to-r from-white/20 to-[#FFFC00]/20'
                        : 'bg-white/10'
                    }`}>
                      {item.mode === 'creative' ? (
                        <Sparkles className="w-5 h-5 text-[#FFFC00]" />
                      ) : item.mode === 'meta' ? (
                        <Zap className="w-5 h-5 text-[#FFFC00]" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {item.mode === 'creative' ? '脑洞模式' : 
                         item.mode === 'meta' ? 'Meta 模式' : 
                         '写实模式'}
                      </p>
                      <p className="text-white/40 text-xs">
                        {new Date(item.timestamp || Date.now()).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {item.location && (
                    <div className="flex items-center gap-1 text-white/40">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">GPS</span>
                    </div>
                  )}
                </div>

                {/* Photo pair */}
                <div className="relative">
                  <img
                    src={item.generatedImage}
                    alt="Generated"
                    className="w-full"
                  />
                  
                  {/* Original thumbnail - top left */}
                  <div className="absolute top-3 left-3 w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-lg">
                    <img
                      src={item.originalImage}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 py-3">
                  <p className="text-white/80 text-sm line-clamp-2">
                    {item.description}
                  </p>
                  
                  {item.creativeElement && (
                    <div className="mt-2 flex items-start gap-2">
                      <span className="text-[#FFFC00] text-xs">💡</span>
                      <p className="text-[#FFFC00] text-xs line-clamp-2 flex-1">
                        {item.creativeElement}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-3 flex items-center justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定删除这张照片？')) {
                        onDeleteHistory(index);
                      }
                    }}
                    className="text-white/40 hover:text-red-400 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIndex !== null && (() => {
        const selectedItem = history[selectedIndex];

        return (
          <div
            className="fixed inset-0 bg-black z-50 overflow-y-auto"
            onClick={() => {
              setSelectedIndex(null);
            }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/10">
              <button
                onClick={() => {
                  setSelectedIndex(null);
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h3 className="text-white font-bold">详情</h3>
              <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Content */}
            <div className="px-4 py-6" onClick={(e) => e.stopPropagation()}>
              {/* Mode badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  selectedItem.mode === 'creative'
                    ? 'bg-[#FFFC00] text-black'
                    : selectedItem.mode === 'meta'
                    ? 'bg-gradient-to-r from-white to-[#FFFC00] text-black'
                    : 'bg-white text-black'
                }`}>
                  {selectedItem.mode === 'creative' ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-bold">脑洞模式</span>
                    </>
                  ) : selectedItem.mode === 'meta' ? (
                    <>
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-bold">Meta 模式</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-bold">写实模式</span>
                    </>
                  )}
                </div>
              </div>

              {/* Generated Image */}
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold mb-2 uppercase">AI生成</p>
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={selectedItem.generatedImage}
                    alt="Generated"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Original Image */}
              <div className="mb-6">
                <p className="text-white/60 text-xs font-semibold mb-2 uppercase">原始照片</p>
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={selectedItem.originalImage}
                    alt="Original"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-2xl p-4 mb-4">
                <p className="text-white/60 text-xs font-semibold mb-2 uppercase">AI描述</p>
                <p className="text-white text-sm leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* User Prompt for Meta mode */}
              {selectedItem.mode === 'meta' && selectedItem.userPrompt && (
                <div className="bg-gradient-to-r from-white/10 to-[#FFFC00]/10 border border-[#FFFC00]/20 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#FFFC00]" />
                    <p className="text-[#FFFC00] text-xs font-semibold uppercase">你的想法</p>
                  </div>
                  <p className="text-[#FFFC00] text-sm leading-relaxed">
                    {selectedItem.userPrompt}
                  </p>
                </div>
              )}

              {/* Creative Element */}
              {selectedItem.creativeElement && (
                <div className="bg-[#FFFC00]/10 border border-[#FFFC00]/20 rounded-2xl p-4 mb-4">
                  <p className="text-[#FFFC00] text-xs font-semibold mb-2 uppercase">💡 脑洞元素</p>
                  <p className="text-[#FFFC00] text-sm leading-relaxed">
                    {selectedItem.creativeElement}
                  </p>
                </div>
              )}

              {/* Location */}
              {selectedItem.location && (
                <div className="bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/60" />
                    <p className="text-white/60 text-xs font-semibold uppercase">位置</p>
                  </div>
                  <p className="text-white text-sm font-mono mt-2">
                    {selectedItem.location?.latitude.toFixed(6)},{' '}
                    {selectedItem.location?.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom spacing */}
            <div className="h-8" />
          </div>
        );
      })()}

      {/* Character Manager Modal */}
      {showCharacterManager && (
        <CharacterManager
          onClose={() => setShowCharacterManager(false)}
        />
      )}
    </div>
  );
}