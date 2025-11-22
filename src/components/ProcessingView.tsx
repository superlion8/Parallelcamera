import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CapturedData, GeneratedResult } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import * as characterDB from '../utils/characterDB';

interface ProcessingViewProps {
  capturedData: CapturedData;
  onComplete: (result: GeneratedResult) => void;
  onCancel: () => void;
}

export function ProcessingView({ capturedData, onComplete, onCancel }: ProcessingViewProps) {
  const [statusText, setStatusText] = useState('正在分析照片...');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);

  useEffect(() => {
    processImage();
  }, []);

  // Smooth progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => Math.min(prev + 0.5, 95));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const processImage = async () => {
    try {
      const isMetaMode = capturedData.mode === 'meta';
      setTotalSteps(isMetaMode ? 2 : 3); // Meta 模式只需要 2 步：分析 + 生成

      // Step 1: Analyze (Meta 模式不带用户 prompt，只客观描述)
      setCurrentStep(1);
      setStatusText(isMetaMode ? '正在分析环境...' : (capturedData.character ? `正在分析照片（含角色 ${capturedData.character.name}）...` : '正在分析照片...'));
      const analyzeResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/analyze-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            image: capturedData.image,
            location: capturedData.location,
            // Meta 模式不传角色给 VLM，只客观描述环境
            character: isMetaMode ? undefined : (capturedData.character ? {
              name: capturedData.character.name,
              referenceImage: capturedData.character.referenceImage,
            } : undefined),
          }),
        }
      );

      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const analyzeData = await analyzeResponse.json();

      if (isMetaMode) {
        // META MODE: 根据用户输入生成角色在环境中的照片
        setCurrentStep(2);
        setStatusText('正在生成 Meta 照片...');
        const metaResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/generate-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              description: analyzeData.description, // 环境描述
              userPrompt: capturedData.userPrompt, // 用户输入
              originalImage: capturedData.image, // 原始环境图
              mode: 'meta',
              character: capturedData.character, // 角色数据
            }),
          }
        );

        if (!metaResponse.ok) {
          throw new Error('Failed to generate meta image');
        }

        const metaData = await metaResponse.json();

        // Increment character usage if character was used
        if (capturedData.character?.id) {
          await characterDB.incrementCharacterUsage(capturedData.character.id);
        }

        const result: GeneratedResult = {
          description: analyzeData.description,
          generatedImage: metaData.image,
          originalImage: capturedData.image,
          location: capturedData.location,
          mode: 'meta',
          timestamp: capturedData.timestamp,
          characterName: capturedData.character?.name,
          userPrompt: capturedData.userPrompt,
        };

        onComplete(result);
      } else if (capturedData.mode === 'creative') {
        // CREATIVE MODE
        // Step 2: Creative element
        setCurrentStep(2);
        setStatusText('正在构思创意...');
        
        const creativeResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/generate-creative-element`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              description: analyzeData.description,
              location: capturedData.location,
            }),
          }
        );

        if (!creativeResponse.ok) {
          throw new Error('Failed to generate creative element');
        }

        const creativeData = await creativeResponse.json();
        const creativeElementText = creativeData.creativeElement;

        // Step 3: Generate
        setCurrentStep(3);
        setStatusText('正在生成平行世界...');
        const generateResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/generate-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              description: analyzeData.description + '\n\n' + creativeElementText,
              location: capturedData.location,
              mode: 'creative',
              creativeElement: creativeElementText,
              originalImage: capturedData.image,
              character: capturedData.character, // 传递角色数据
            }),
          }
        );

        if (!generateResponse.ok) {
          throw new Error('Failed to generate image');
        }

        const generateData = await generateResponse.json();
        setProgress(100);
        setStatusText('完成！');

        // Increment character usage if character was used
        if (capturedData.character?.id) {
          await characterDB.incrementCharacterUsage(capturedData.character.id);
        }

        setTimeout(() => {
          onComplete({
            description: analyzeData.description,
            generatedImage: generateData.image,
            originalImage: capturedData.image,
            location: capturedData.location,
            mode: 'creative',
            creativeElement: creativeElementText,
            characterName: capturedData.character?.name,
          });
        }, 500);

      } else {
        // REALISTIC MODE
        // Step 2: Generate
        setCurrentStep(2);
        setStatusText('正在生成平行世界...');
        const generateResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f359b1dc/generate-image`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              description: analyzeData.description,
              location: capturedData.location,
              mode: 'realistic',
              originalImage: undefined,
              character: capturedData.character, // 传递角色数据
            }),
          }
        );

        if (!generateResponse.ok) {
          throw new Error('Failed to generate image');
        }

        const generateData = await generateResponse.json();
        setProgress(100);
        setStatusText('完成！');

        // Increment character usage if character was used
        if (capturedData.character?.id) {
          await characterDB.incrementCharacterUsage(capturedData.character.id);
        }

        setTimeout(() => {
          onComplete({
            description: analyzeData.description,
            generatedImage: generateData.image,
            originalImage: capturedData.image,
            location: capturedData.location,
            mode: 'realistic',
            characterName: capturedData.character?.name,
          });
        }, 500);
      }

    } catch (error) {
      console.error('Processing error:', error);
      alert('处理失败，请重试');
      onCancel();
    }
  };

  return (
    <div className="h-full w-full bg-black flex flex-col items-center justify-center relative">
      {/* Cancel Button */}
      <button
        onClick={onCancel}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Preview Image */}
      <div className="mb-8">
        <div className="w-48 h-48 rounded-3xl overflow-hidden">
          <img
            src={capturedData.image}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Loading Spinner - Simple style */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
        <div 
          className={`absolute inset-0 rounded-full border-4 ${
            capturedData.mode === 'creative' ? 'border-[#FFFC00]' : 
            capturedData.mode === 'meta' ? 'border-transparent bg-gradient-to-r from-white to-[#FFFC00]' :
            'border-white'
          } border-t-transparent animate-spin`}
        ></div>
      </div>

      {/* Status Text */}
      <p className="text-white text-lg font-medium mb-2">{statusText}</p>
      
      {/* Progress */}
      <div className="flex items-center gap-3">
        <p className="text-white/60 text-sm">
          {capturedData.mode === 'meta' && `步骤 ${currentStep}/${totalSteps} · `}
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}