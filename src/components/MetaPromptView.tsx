import { useState, useRef, useEffect } from 'react';
import { Mic, ArrowRight, SkipForward } from 'lucide-react';
import { CapturedData } from '../App';

interface MetaPromptViewProps {
  capturedData: CapturedData;
  onConfirm: (dataWithPrompt: CapturedData) => void;
  onBack: () => void;
}

export function MetaPromptView({ capturedData, onConfirm, onBack }: MetaPromptViewProps) {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState(''); // 实时显示识别中的文字
  const [recognitionStatus, setRecognitionStatus] = useState(''); // 识别状态
  const [browserWarning, setBrowserWarning] = useState(''); // 浏览器兼容性警告
  const [useCloudRecognition, setUseCloudRecognition] = useState(false); // 是否使用云端识别
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isPressingRef = useRef(false);
  const isRecognitionActiveRef = useRef(false); // 识别是否真正在运行
  const accumulatedTextRef = useRef(''); // 累积的文本
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 初始化语音识别
  useEffect(() => {
    // 检测浏览器和运行环境
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isChrome = /crios/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/crios/.test(userAgent) && !/fxios/.test(userAgent);
    
    // 检测是否在 PWA 模式（standalone mode）
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    console.log('🌍 浏览器信息:', { isIOS, isChrome, isSafari, isPWA, userAgent });
    console.log('📱 iOS版本:', navigator.userAgent.match(/OS (\d+)_/)?.[1]);
    console.log('📲 运行模式:', isPWA ? 'PWA (主屏幕启动)' : '浏览器');
    
    // iOS PWA 模式：使用云端录音识别
    if (isIOS && isPWA) {
      console.log('🌐 检测到 PWA 模式，将使用云端语音识别');
      setUseCloudRecognition(true);
      return; // 不初始化 Web Speech API
    }
    
    // iOS Chrome 不支持 Web Speech API
    if (isIOS && isChrome) {
      setBrowserWarning('iOS Chrome 不支持语音输入，请使用 Safari 浏览器打开');
      console.warn('⚠️ iOS Chrome 不支持 Web Speech API');
      return;
    }
    
    // 检查 Web Speech API 支持
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('⚠️ 浏览器不支持 Web Speech API，尝试云端识别');
      setUseCloudRecognition(true);
      return;
    }

    // 使用 Web Speech API (Safari 浏览器)
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    // ✅ 关键配置：使用连续模式，手动控制停止
    recognitionInstance.lang = 'zh-CN';
    recognitionInstance.continuous = true; // 改为连续模式，避免自动停止重启的问题
    recognitionInstance.interimResults = true;
    recognitionInstance.maxAlternatives = 1;
    
    console.log('🎤 识别器配置:', {
      lang: recognitionInstance.lang,
      continuous: recognitionInstance.continuous,
      interimResults: recognitionInstance.interimResults
    });

    // onstart: 识别成功启动
    recognitionInstance.onstart = () => {
      console.log('✅ [onstart] 识别已启动');
      isRecognitionActiveRef.current = true;
      setRecognitionStatus('麦克风已就绪');
      accumulatedTextRef.current = '';
      setInterimText('');
    };

    // onaudiostart: 开始捕获音频
    recognitionInstance.onaudiostart = () => {
      console.log('🎙️ [onaudiostart] 音频捕获开始');
      setRecognitionStatus('正在听...');
    };

    // onsoundstart: 检测到声音
    recognitionInstance.onsoundstart = () => {
      console.log('🔊 [onsoundstart] 检测到声音');
    };

    // onspeechstart: 检测到语音
    recognitionInstance.onspeechstart = () => {
      console.log('🗣️ [onspeechstart] 检测到语音');
      setRecognitionStatus('正在识别...');
    };

    // onresult: 识别到内容
    recognitionInstance.onresult = (event: any) => {
      console.log('📥 [onresult] 结果数量:', event.results.length);
      
      let interim = '';
      let final = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
          console.log('  ✓ 最终结果:', transcript);
        } else {
          interim += transcript;
          console.log('  … 临时结果:', transcript);
        }
      }
      
      // 显示临时结果
      setInterimText(interim);
      
      // 累积最终结果
      if (final) {
        accumulatedTextRef.current += final;
        console.log('📝 累积文本:', accumulatedTextRef.current);
      }
    };

    // onspeechend: 语音结束
    recognitionInstance.onspeechend = () => {
      console.log('🤐 [onspeechend] 语音结束');
    };

    // onsoundend: 声音结束
    recognitionInstance.onsoundend = () => {
      console.log('🔇 [onsoundend] 声音结束');
    };

    // onaudioend: 音频捕获结束
    recognitionInstance.onaudioend = () => {
      console.log('🎙️ [onaudioend] 音频捕获结束');
    };

    // onerror: 错误处理
    recognitionInstance.onerror = (event: any) => {
      console.error('❌ [onerror] 错误类型:', event.error);
      console.error('   详细信息:', event);
      
      // aborted 错误通常是因为手动停止或重复启动
      if (event.error === 'aborted') {
        console.log('   → 识别被中止（通常是正常停止）');
        return; // 不显示错误，这是预期行为
      }
      
      if (event.error === 'no-speech') {
        setRecognitionStatus('未检测到语音');
      } else if (event.error === 'audio-capture') {
        setRecognitionStatus('无法访问麦克风');
      } else if (event.error === 'not-allowed') {
        setRecognitionStatus('麦克风权限被拒绝');
        alert('请在设置中允许此网站使用麦克风');
      } else if (event.error === 'network') {
        setRecognitionStatus('网络错误');
      } else {
        setRecognitionStatus(`错误: ${event.error}`);
      }
    };
    
    // onend: 识别结束
    recognitionInstance.onend = () => {
      console.log('🔄 [onend] 识别结束');
      console.log('   → 按住状态:', isPressingRef.current);
      console.log('   → 累积文本:', accumulatedTextRef.current);
      
      isRecognitionActiveRef.current = false;
      
      // ❌ 不再自动重启！让用户重新按下按钮
      setIsListening(false);
      setInterimText('');
      setRecognitionStatus('');
      isPressingRef.current = false;
      
      // 保存累积的文本
      if (accumulatedTextRef.current) {
        setPrompt(prev => {
          const newText = prev + accumulatedTextRef.current;
          console.log('💾 保存到输入框:', newText);
          return newText;
        });
        accumulatedTextRef.current = '';
      }
    };

    recognitionRef.current = recognitionInstance;
    console.log('🏗️ 识别器初始化完成');

    return () => {
      console.log('🧹 清理识别器');
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('清理时停止识别失败:', e);
        }
      }
    };
  }, []);

  // 云端录音识别 - 按住开始
  const handleCloudRecordStart = async () => {
    console.log('🌐 按下按钮 - 使用云端识别');
    isPressingRef.current = true;
    setIsListening(true);
    setRecognitionStatus('启动麦克风...');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📼 音频数据:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('⏹️ 录音停止，开始识别...');
        setRecognitionStatus('正在识别...');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('📦 音频总大小:', audioBlob.size, 'bytes');
        
        // 转换为 base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            // 调用后端API
            const { projectId, publicAnonKey } = await import('../utils/supabase/info');
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/speech-to-text`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: JSON.stringify({ audio: base64Audio })
              }
            );
            
            if (!response.ok) {
              throw new Error(`识别失败: ${response.status}`);
            }
            
            const { text } = await response.json();
            console.log('✅ 识别结果:', text);
            
            // 添加到输入框
            setPrompt(prev => prev + text);
            setRecognitionStatus('');
            setIsListening(false);
            
          } catch (error) {
            console.error('❌ 识别失败:', error);
            setRecognitionStatus('识别失败');
            setTimeout(() => {
              setRecognitionStatus('');
              setIsListening(false);
            }, 2000);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecognitionStatus('正在录音...');
      console.log('🎤 开始录音');
      
    } catch (error) {
      console.error('❌ 麦克风访问失败:', error);
      setRecognitionStatus('麦克风权限被拒绝');
      setIsListening(false);
      isPressingRef.current = false;
    }
  };

  // 云端录音识别 - 松开停止
  const handleCloudRecordEnd = () => {
    console.log('👋 松开按钮 - 停止录音');
    isPressingRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // 按住开始录音
  const handleVoiceStart = () => {
    if (useCloudRecognition) {
      handleCloudRecordStart();
      return;
    }
    
    console.log('👆 按下按钮');
    
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音输入');
      return;
    }

    isPressingRef.current = true;
    setIsListening(true);
    setRecognitionStatus('启动中...');

    try {
      recognitionRef.current.start();
      console.log('🎤 开始识别');
    } catch (error: any) {
      console.error('启动失败:', error);
      setRecognitionStatus('启动失败: ' + error.message);
      if (!error.message?.includes('already')) {
        isPressingRef.current = false;
        setIsListening(false);
      }
    }
  };

  // 松开停止录音
  const handleVoiceEnd = () => {
    if (useCloudRecognition) {
      handleCloudRecordEnd();
      return;
    }
    
    console.log('👋 [handleVoiceEnd] 松开按钮');
    console.log('   → 当前识别状态:', isRecognitionActiveRef.current);
    
    isPressingRef.current = false;
    
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        console.log('⏹️ 调用 stop()');
        recognitionRef.current.stop();
        // 注意：文本保存会在 onend 事件中处理，不在这里处理
      } catch (error) {
        console.error('❌ 停止失败:', error);
      }
    } else {
      console.log('⚠️ 识别器未运行，跳过停止');
      setIsListening(false);
      setRecognitionStatus('');
    }
  };

  const handleConfirm = () => {
    onConfirm({
      ...capturedData,
      userPrompt: prompt.trim() || undefined,
    });
  };

  const handleSkip = () => {
    onConfirm({
      ...capturedData,
      userPrompt: undefined,
    });
  };

  return (
    <div className="h-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-white to-[#FFFC00] text-black">
            <span className="text-sm font-bold">Meta 模式</span>
          </div>
          
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Preview Image - 缩小高度 */}
      <div className="flex-shrink-0 px-6 mb-3">
        <div className="rounded-2xl overflow-hidden relative" style={{ height: '35vh', maxHeight: '280px' }}>
          <img 
            src={capturedData.image} 
            alt="Captured" 
            className="w-full h-full object-cover"
          />
          {capturedData.character && (
            <div className="absolute bottom-3 left-3 bg-[#FFFC00] text-black px-3 py-1.5 rounded-full text-xs font-bold">
              角色: {capturedData.character.name}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Content Area - 固定高度，内部可滚动 */}
      <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
        <div className="mb-3 flex-shrink-0">
          <h2 className="text-white font-bold text-lg mb-1">描述你想要的场景</h2>
          <p className="text-white/60 text-xs">
            告诉 AI 你想让 {capturedData.character?.name} 出现在什么样的场景中
          </p>
        </div>

        {/* Text Input - Fixed Height */}
        <div className="mb-3 h-20 flex-shrink-0">
          <div className="relative h-full">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：在海边散步，在咖啡厅看书，在森林里露营..."
              className="w-full h-full bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 resize-none focus:outline-none focus:border-[#FFFC00] transition-colors text-sm"
              maxLength={200}
              style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
            />
            {/* 实时识别结果显示 */}
            {isListening && interimText && (
              <div className="absolute top-3 left-4 right-4 text-[#FFFC00] text-sm opacity-70 pointer-events-none">
                {interimText}
              </div>
            )}
            <div className="absolute bottom-2 right-3 text-white/40 text-xs">
              {prompt.length}/200
            </div>
          </div>
        </div>

        {/* 识别状态指示器 */}
        {isListening && recognitionStatus && (
          <div className="mb-2 flex-shrink-0">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-[#FFFC00] rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm">{recognitionStatus}</span>
            </div>
          </div>
        )}

        {/* 浏览器兼容性警告 */}
        {browserWarning && (
          <div className="mb-3 flex-shrink-0">
            <div className="bg-orange-500/20 border-2 border-orange-400 rounded-xl px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="text-orange-400 text-lg">⚠️</div>
                <div className="flex-1">
                  <div className="text-orange-300 font-bold text-sm mb-1">语音输入不可用</div>
                  <div className="text-orange-200/90 text-xs mb-2">{browserWarning}</div>
                  <div className="text-white/70 text-xs leading-relaxed">
                    <strong className="text-[#FFFC00]">💡 如需使用语音：</strong><br/>
                    1. 点击右上角 "•••" 或 "分享" 按钮<br/>
                    2. 选择 "在 Safari 中打开"<br/>
                    3. 语音功能将立即可用<br/><br/>
                    <span className="text-white/50">或直接使用键盘输入场景描述</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Input Button - 按住说话，禁用文字选择 */}
        {!browserWarning && (
          <button
            onMouseDown={handleVoiceStart}
            onMouseUp={handleVoiceEnd}
            onMouseLeave={handleVoiceEnd}
            onTouchStart={(e) => {
              e.preventDefault();
              handleVoiceStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleVoiceEnd();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`mb-3 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all flex-shrink-0 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse scale-95' 
                : 'bg-white/10 backdrop-blur-sm text-white'
            }`}
            style={{ 
              WebkitUserSelect: 'none', 
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              touchAction: 'manipulation'
            }}
          >
            {isListening ? (
              <>
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                </div>
                <span>松开结束...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>按住说话</span>
              </>
            )}
          </button>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <button
            onClick={handleSkip}
            className="py-3.5 rounded-2xl font-bold bg-white/10 backdrop-blur-sm text-white active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            <span>跳过</span>
          </button>
          
          <button
            onClick={handleConfirm}
            className="py-3.5 rounded-2xl font-bold bg-gradient-to-r from-white to-[#FFFC00] text-black active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <span>确认</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}