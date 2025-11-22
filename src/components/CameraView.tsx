import { useRef, useState, useEffect } from 'react';
import { CapturedData, GenerationMode } from '../App';
import { CharacterManager } from './CharacterManager';
import type { Character } from '../utils/characterDB';
import svgPaths from '../imports/svg-camera-icons';

interface CameraViewProps {
  onCapture: (data: CapturedData & { character?: Character }) => void;
  onBack?: () => void;
}

export function CameraView({ onCapture, onBack }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mode, setMode] = useState<GenerationMode>('realistic');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCharacterManager, setShowCharacterManager] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied');
        }
      );
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCamera(true);
    } catch (error: any) {
      console.log('Camera not available');
      setHasCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    // Meta 模式必须选择角色
    if (mode === 'meta' && !selectedCharacter) {
      alert('Meta 模式需要先选择一个角色！');
      return;
    }

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const videoRect = video.getBoundingClientRect();
    const videoDisplayWidth = videoRect.width;
    const videoDisplayHeight = videoRect.height;
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    const videoAspect = videoWidth / videoHeight;
    const displayAspect = videoDisplayWidth / videoDisplayHeight;
    
    let sx, sy, sWidth, sHeight;
    
    if (videoAspect > displayAspect) {
      sHeight = videoHeight;
      sWidth = videoHeight * displayAspect;
      sx = (videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = videoWidth;
      sHeight = videoWidth / displayAspect;
      sx = 0;
      sy = (videoHeight - sHeight) / 2;
    }
    
    canvas.width = sWidth;
    canvas.height = sHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);

    setTimeout(() => {
      onCapture({
        image: imageData,
        location: location || undefined,
        timestamp: Date.now(),
        mode: mode,
        character: selectedCharacter || undefined,
      });
      setIsCapturing(false);
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      onCapture({
        image: imageData,
        location: location || undefined,
        timestamp: Date.now(),
        mode: mode,
        character: selectedCharacter || undefined,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setShowCharacterManager(false);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Video Preview or No Camera State */}
      {hasCamera ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-[#101828] rounded-lg p-8 max-w-xs w-full mx-6 text-center">
            {/* Camera Icon */}
            <div className="w-16 h-16 mx-auto mb-4 opacity-30">
              <svg className="w-full h-full" fill="none" viewBox="0 0 64 64">
                <path d={svgPaths.p3cecda00} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="5.33242" />
                <path d={svgPaths.p3c078880} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.3" strokeWidth="5.33242" />
              </svg>
            </div>
            <p className="text-white/60 mb-2">相机不可用</p>
            <p className="text-white/40 text-sm">请使用下方上传按钮</p>
          </div>
        </div>
      )}

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar - Home Button */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent pb-4">
        <div className="pt-4 px-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
              <path d={svgPaths.p18f5fc0} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66632" />
              <path d={svgPaths.p1f31d100} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66632" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent pt-12 pb-8">
        {/* Mode Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 inline-flex gap-1">
            <button
              onClick={() => setMode('realistic')}
              className={`px-4 py-2 rounded-full transition-all ${
                mode === 'realistic'
                  ? 'bg-white text-black'
                  : 'text-white'
              }`}
            >
              写实
            </button>
            <button
              onClick={() => setMode('creative')}
              className={`px-4 py-2 rounded-full transition-all ${
                mode === 'creative'
                  ? 'bg-white text-black'
                  : 'text-white'
              }`}
            >
              脑洞
            </button>
            <button
              onClick={() => setMode('meta')}
              className={`px-4 py-2 rounded-full transition-all ${
                mode === 'meta'
                  ? 'bg-white text-black'
                  : 'text-white'
              }`}
            >
              Meta
            </button>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6 px-8">
          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d="M11.9987 2.99967V14.9984" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
              <path d={svgPaths.p3d662900} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
              <path d={svgPaths.p37de1500} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
            </svg>
          </button>

          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={!hasCamera || isCapturing}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              !hasCamera || isCapturing ? 'opacity-50' : 'active:scale-95'
            }`}
          >
            {/* Outer Ring - changes based on mode */}
            {mode === 'meta' ? (
              // Meta mode: gradient border using inset trick
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-[#FFFC00]">
                <div className="absolute inset-[3.8px] rounded-full bg-black" />
              </div>
            ) : (
              // Realistic & Creative modes: simple border
              <div className={`absolute inset-0 rounded-full border-[3.8px] ${
                mode === 'creative' ? 'border-[#FFFC00]' : 'border-white'
              }`} />
            )}
            
            {/* Inner Circle - changes based on mode */}
            <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${
              mode === 'creative' ? 'bg-[#FFFC00]' :
              mode === 'meta' ? 'bg-gradient-to-br from-white to-[#FFFC00]' :
              'bg-white'
            }`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 32 32">
                <path d={svgPaths.p2cbe2180} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66571" />
                <path d={svgPaths.p15f23500} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.66571" />
              </svg>
            </div>
          </button>

          {/* Character Button */}
          <button
            onClick={() => setShowCharacterManager(true)}
            className={`w-12 h-12 rounded-xl backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform ${
              selectedCharacter ? 'bg-[#FFFC00]' : 'bg-white/20'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
              <path d={svgPaths.p2c5edd40} stroke={selectedCharacter ? "black" : "white"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
              <path d={svgPaths.p13aa09b0} stroke={selectedCharacter ? "black" : "white"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
              <path d={svgPaths.p27efdf00} stroke={selectedCharacter ? "black" : "white"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
              <path d={svgPaths.p167ecf00} stroke={selectedCharacter ? "black" : "white"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.99978" />
            </svg>
          </button>
        </div>

        {/* Selected Character Indicator */}
        {selectedCharacter && (
          <div className="mt-4 flex justify-center">
            <div className="bg-[#FFFC00] text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <span>已选择角色: {selectedCharacter.name}</span>
              <button
                onClick={() => setSelectedCharacter(null)}
                className="ml-1 hover:opacity-70"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Character Manager Modal */}
      {showCharacterManager && (
        <CharacterManager
          onClose={() => setShowCharacterManager(false)}
          onSelectCharacter={handleSelectCharacter}
          selectionMode={true}
        />
      )}
    </div>
  );
}
