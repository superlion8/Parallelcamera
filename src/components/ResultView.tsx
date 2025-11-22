import { useState } from 'react';
import { X, ChevronUp, Download, Image as ImageIcon, Sparkles, Camera, Zap } from 'lucide-react';
import { GeneratedResult } from '../App';

interface ResultViewProps {
  result: GeneratedResult;
  onReset: () => void;
}

export function ResultView({ result, onReset }: ResultViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleDownload = (imageUrl: string, suffix: string) => {
    // Convert base64 to blob if needed
    fetch(imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `parallel-${suffix}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Download failed:', err);
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `parallel-${suffix}-${Date.now()}.jpg`;
        link.click();
      });
  };

  const handleDownloadAll = () => {
    handleDownload(result.generatedImage, result.mode);
  };

  return (
    <div className="h-full w-full bg-black relative flex flex-col">
      {/* Close Button */}
      <button
        onClick={onReset}
        className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Mode Badge */}
      <div className="absolute top-6 left-6 z-30">
        <div className={`px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 ${
          result.mode === 'creative' ? 'bg-[#FFFC00] text-black' : 
          result.mode === 'meta' ? 'bg-gradient-to-r from-white to-[#FFFC00] text-black' :
          'bg-white text-black'
        }`}>
          {result.mode === 'creative' ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">脑洞</span>
            </>
          ) : result.mode === 'meta' ? (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">Meta</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">写实</span>
            </>
          )}
        </div>
      </div>

      {/* Image Display */}
      <div className="flex-1 relative">
        <img
          src={result.generatedImage}
          alt="Generated"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Bottom Sheet */}
      <div className="relative">
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform z-20"
        >
          <ChevronUp 
            className={`w-5 h-5 text-white transition-transform ${showDetails ? '' : 'rotate-180'}`}
          />
        </button>

        {/* Bottom Panel */}
        <div 
          className={`bg-black/90 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ${
            showDetails ? 'max-h-[60vh]' : 'max-h-24'
          } overflow-hidden`}
        >
          {/* Action Buttons - Always visible */}
          <div className="px-6 py-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadAll}
              className={`py-4 rounded-2xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                result.mode === 'creative' ? 'bg-[#FFFC00] text-black' :
                result.mode === 'meta' ? 'bg-gradient-to-r from-white to-[#FFFC00] text-black' :
                'bg-white text-black'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>保存</span>
            </button>
            
            <button
              onClick={onReset}
              className="py-4 bg-white/10 rounded-2xl text-white font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>再拍一张</span>
            </button>
          </div>

          {/* Details - Show when expanded */}
          {showDetails && (
            <div className="px-6 pb-8 space-y-4 overflow-y-auto max-h-[calc(60vh-120px)]">
              {/* AI Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-white/60 rounded-full"></div>
                  <p className="text-white/60 text-xs font-bold uppercase">AI 描述</p>
                </div>
                <p className="text-white text-sm leading-relaxed pl-3">
                  {result.description}
                </p>
              </div>

              {/* User Prompt for Meta mode */}
              {result.mode === 'meta' && result.userPrompt && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#FFFC00]" />
                    <p className="text-[#FFFC00] text-xs font-bold uppercase">你的想法</p>
                  </div>
                  <p className="text-[#FFFC00]/90 text-sm leading-relaxed pl-6">
                    {result.userPrompt}
                  </p>
                </div>
              )}

              {/* Creative Element */}
              {result.creativeElement && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#FFFC00]" />
                    <p className="text-[#FFFC00] text-xs font-bold uppercase">脑洞元素</p>
                  </div>
                  <p className="text-[#FFFC00]/90 text-sm leading-relaxed pl-6">
                    {result.creativeElement}
                  </p>
                </div>
              )}

              {/* Original Image Preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-white/60" />
                  <p className="text-white/60 text-xs font-bold uppercase">原始照片</p>
                </div>
                <div className="pl-6">
                  <div className="rounded-xl overflow-hidden w-32 h-32">
                    <img
                      src={result.originalImage}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              {result.location && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 bg-white/60 rounded-full"></div>
                    <p className="text-white/60 text-xs font-bold uppercase">拍摄位置</p>
                  </div>
                  <p className="text-white/40 text-xs font-mono pl-3">
                    {result.location.latitude.toFixed(6)}, {result.location.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}